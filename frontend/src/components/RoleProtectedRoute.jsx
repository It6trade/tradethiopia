import React from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { Box, Text, Button } from '@chakra-ui/react';
import { useUserStore } from '../store/user.js';

const normalizeRoleValue = (value = '') =>
  value?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const currentUser = useUserStore((s) => s.currentUser);
  const normalizedAllowed = allowedRoles.map(normalizeRoleValue);
  const normalizedUserRole = normalizeRoleValue(
    currentUser?.role || currentUser?.normalizedRole
  );

  console.log('RoleProtectedRoute - check:', {
    hasCurrentUser: !!currentUser,
    hasToken: !!currentUser?.token,
    userRole: currentUser?.role,
    normalizedUserRole,
    normalizedAllowed,
    isAllowed: normalizedAllowed.includes(normalizedUserRole)
  });

  // If not logged in, redirect to login
  if (!currentUser || !currentUser.token) {
    console.log('RoleProtectedRoute - Redirecting to /login (no user or token)');
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed, show access denied
  if (!normalizedAllowed.includes(normalizedUserRole)) {
    return (
      <Box p={6} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" mb={4}>Access denied</Text>
        <Text mb={6}>You do not have permission to view this page.</Text>
        <Button as={RouterLink} to="/" colorScheme="blue">Go Home</Button>
      </Box>
    );
  }

  // Allowed
  return children;
};

export default RoleProtectedRoute;
