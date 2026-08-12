import { useEffect, useState } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import ProtectedRoute from './ProtectedRoute';

const ApprovalCheck = ({ children }) => {
  const [state, setState] = useState('checking');

  useEffect(() => {
    let active = true;
    axiosInstance.get('/users/personal-information/me')
      .then(({ data }) => {
        if (active) setState(data.data?.record?.status === 'approved' ? 'approved' : 'not-approved');
      })
      .catch(() => {
        if (active) setState('not-approved');
      });
    return () => { active = false; };
  }, []);

  if (state === 'checking') {
    return <Center minH="100vh"><Spinner color="teal.500" size="xl" /></Center>;
  }
  if (state !== 'approved') return <Navigate to="/employee-info" replace />;
  return children;
};

const ApprovedOnboardingRoute = ({ children }) => (
  <ProtectedRoute>
    <ApprovalCheck>{children}</ApprovalCheck>
  </ProtectedRoute>
);

export default ApprovedOnboardingRoute;
