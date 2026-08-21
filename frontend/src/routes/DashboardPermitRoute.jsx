import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { useUserStore } from '../store/user';
import {
  isUserPermittedForDashboard,
  getOnboardingRedirectPath,
} from '../utils/dashboardAccess';

const DashboardPermitRoute = ({ children }) => {
  const { currentUser, refreshCurrentUser } = useUserStore();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (currentUser?.token && !isUserPermittedForDashboard(currentUser)) {
      setChecking(true);
      refreshCurrentUser()
        .catch(() => {})
        .finally(() => {
          if (mounted) setChecking(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [currentUser?.token]);

  if (!currentUser || !currentUser.token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return (
      <Center minH="100vh">
        <Spinner color="teal.500" size="xl" thickness="4px" />
      </Center>
    );
  }

  const isPermitted = isUserPermittedForDashboard(currentUser);

  if (!isPermitted) {
    const targetPath = getOnboardingRedirectPath(currentUser);
    console.log(
      `[DashboardPermitRoute] Access Denied: User ${currentUser.username || currentUser.email} has no HR dashboard permit. Redirecting to: ${targetPath}`
    );
    return <Navigate to={targetPath} replace />;
  }

  return children;
};

export default DashboardPermitRoute;
