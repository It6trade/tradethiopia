// File: src/pages/Dashboard.jsx

import React, { useState } from 'react';
import { Box, Flex, Text, Button, useToast, Input } from '@chakra-ui/react';
import KpiCards from '../components/kpiCards';
import AnalyticsGraphs from '../components/AnalyticsGraphs';
import TasksAndAlerts from '../components/TasksAndAlerts';
import NotificationsPanel from '../components/NotificationsPanel';
import AssetDashboard from '../components/AssetDashboard';
import AwardsPanel from '../components/AwardsPanel';
import CompletedSalesTable from '../components/salesmanager/CompletedSalesTable';
import { useUserStore } from '../store/user';
import { calculateAwards } from '../services/awardService';

const getCurrentMonth = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
};

const AdminAssetSection = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [month, setMonth] = useState(getCurrentMonth());

  const handleCalculate = async () => {
    if (!confirm(`Publish awards for ${month}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await calculateAwards(month);
      if (res && res.success) {
        toast({ title: 'Awards published', description: `Published ${res.data.length} awards`, status: 'success', duration: 5000 });
      } else {
        toast({ title: 'Failed', description: res.message || 'Unknown error', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message || String(err), status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mb={4}>
      <Flex mb={3} align="center" justify="space-between">
        <Text fontWeight="bold">Asset Dashboard</Text>
        <Flex gap={3} align="center">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} max={getCurrentMonth()} />
          <Button colorScheme="teal" onClick={handleCalculate} isLoading={loading} loadingText="Publishing...">
            Calculate Awards ({month})
          </Button>
        </Flex>
      </Flex>
      <AssetDashboard />
    </Box>
  );
};

const Dashboard = () => {
  const currentUser = useUserStore.getState().currentUser;

  return (
    // Remove negative margin since AppLayout now handles the navbar positioning
    <Box pt={3} p={4}>
      {/* Reduced gap between KpiCards and AnalyticsGraphs */}
      <Box mb={4}>
        <KpiCards />
      </Box>

      {/** Show asset dashboard only for admin users and show Calculate button */}
      {currentUser && (currentUser.role === 'admin' || currentUser.normalizedRole === 'admin') && (
        <>
          <AdminAssetSection currentUser={currentUser} />
          <Box mb={4}>
            <AwardsPanel month={getCurrentMonth()} />
          </Box>
          <Box mb={4}>
            <CompletedSalesTable title="Completed Sales Follow-ups" />
          </Box>
        </>
      )}

      {/* Analytics Section */}
      <Flex direction="column" align="center" mb={4}>
        <AnalyticsGraphs />
      </Flex>
    </Box>
  );
};

export default Dashboard;
