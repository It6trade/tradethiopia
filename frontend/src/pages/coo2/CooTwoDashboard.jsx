// src/pages/coo2/CooTwoDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import CooSidebar from './CooSidebar';
import CooHeader from './CooHeader';
import OverviewView from './OverviewView';
import AnalyticsView from './AnalyticsView';
import ReportsView from './ReportsView';
import NotificationsView from './NotificationsView';
import AgentsView from './AgentsView';
import CreateReportModal from './CreateReportModal';
import QuickSearchModal from './QuickSearchModal';
import { useUserStore } from '../../store/user';

const CooTwoDashboard = () => {
  const { currentUser } = useUserStore();
  const [activeTab, setActiveTab] = useState('departments');
  const [selectedDept, setSelectedDept] = useState('all');
  const [dateRange, setDateRange] = useState('Weekly');
  const [, setDataRevision] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(3);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false);
  const [departmentsMenuOpen, setDepartmentsMenuOpen] = useState(false);
  const mainScrollRef = useRef(null);

  const {
    isOpen: isReportModalOpen,
    onOpen: onOpenReportModal,
    onClose: onCloseReportModal,
  } = useDisclosure();

  const {
    isOpen: isSearchModalOpen,
    onOpen: onOpenSearchModal,
    onClose: onCloseSearchModal,
  } = useDisclosure();

  const toast = useToast();

  const openDepartments = () => {
    setActiveTab('departments');
    setMainSidebarCollapsed(false);
    setDepartmentsMenuOpen(true);
  };

  const selectDepartment = (deptId) => {
    setSelectedDept(deptId);
    openDepartments();
  };

  const selectMainTab = (tab) => {
    if (tab === 'departments') {
      setActiveTab('departments');
      setMainSidebarCollapsed(false);
      setDepartmentsMenuOpen((isOpen) => activeTab === 'departments' ? !isOpen : true);
      return;
    }

    setActiveTab(tab);
    setDepartmentsMenuOpen(false);
    if (tab === 'agents') setMainSidebarCollapsed(false);
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearchModal]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab, selectedDept]);

  const handleRefresh = () => {
    toast({
      title: 'Real-time telemetry updated',
      description: 'Fetched latest operational metrics across 10 departments.',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  return (
    <Flex h="100dvh" maxH="100dvh" minH={0} bg="#f8fafc" color="#0f172a" overflow="hidden">
      {/* 1. Main Dark Left Sidebar */}
      <CooSidebar
        activeTab={activeTab}
        setActiveTab={selectMainTab}
        unreadNotifsCount={unreadNotifsCount}
        currentUser={currentUser}
        collapsed={mainSidebarCollapsed}
        selectedDept={selectedDept}
        setSelectedDept={selectDepartment}
        departmentsMenuOpen={departmentsMenuOpen}
        onToggleCollapse={() => setMainSidebarCollapsed(!mainSidebarCollapsed)}
      />

      {/* 2. Main Dashboard Body Container */}
      <Flex direction="column" flex={1} minW={0} minH={0} h="100%" overflow="hidden">
        {/* Header Bar */}
        <CooHeader
          onToggleSidebar={() => setMainSidebarCollapsed(!mainSidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSearchModal={onOpenSearchModal}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onCreateReportClick={onOpenReportModal}
          unreadCount={unreadNotifsCount}
          currentUser={currentUser}
          onRefresh={handleRefresh}
          onNotificationsClick={() => selectMainTab('notifications')}
          onDataImported={() => setDataRevision((revision) => revision + 1)}
          selectedDepartment={selectedDept}
        />

        {/* Dynamic Views Rendering */}
        <Box
          ref={mainScrollRef}
          p={{ base: 4, md: 6, lg: 8 }}
          flex={1}
          minH={0}
          overflowY="auto"
          overflowX="hidden"
          overscrollBehavior="contain"
          sx={{
            scrollbarGutter: 'stable',
            scrollbarWidth: 'thin',
            scrollbarColor: '#94a3b8 #f1f5f9',
            '&::-webkit-scrollbar': { width: '8px', background: '#f1f5f9' },
            '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
            '&::-webkit-scrollbar-thumb': {
              background: '#94a3b8',
              border: '2px solid #f1f5f9',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': { background: '#64748b' },
            '&::-webkit-scrollbar-button': { display: 'none', width: 0, height: 0 },
          }}
        >
          {activeTab === 'departments' && (
            <OverviewView
              departmentId={selectedDept}
              currentUser={currentUser}
              dateRange={dateRange}
              setDateRange={setDateRange}
              onNavigateTab={selectMainTab}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'reports' && (
            <ReportsView onCreateReportModalOpen={onOpenReportModal} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              unreadCount={unreadNotifsCount}
              setUnreadCount={setUnreadNotifsCount}
            />
          )}

          {activeTab === 'agents' && <AgentsView />}

          {activeTab === 'projects' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={5}>
                <Box as="h2" fontSize="22px" fontWeight="800" color="#0f172a" mb={1}>
                  Cross-Departmental Strategic Projects
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Real-time milestone tracking across 142 active enterprise and divisional initiatives.
                </Box>
              </Box>
              <OverviewView
                departmentId={selectedDept}
                currentUser={currentUser}
                dateRange={dateRange}
                setDateRange={setDateRange}
                onNavigateTab={selectMainTab}
              />
            </Box>
          )}

          {activeTab === 'users' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={5}>
                <Box as="h2" fontSize="22px" fontWeight="800" color="#0f172a" mb={1}>
                  Workforce & Department Leadership Directory
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Operational department heads, team distribution, and active assignments.
                </Box>
              </Box>
              <AnalyticsView />
            </Box>
          )}

          {activeTab === 'documentation' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={4}>
                <Box as="h2" fontSize="20px" fontWeight="800" color="#0f172a" mb={1}>
                  2 COO Executive Platform Documentation
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Operational standard operating procedures (SOPs), API specifications, and workflow guides.
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 'settings' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={4}>
                <Box as="h2" fontSize="20px" fontWeight="800" color="#0f172a" mb={1}>
                  Executive Platform Settings
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Configure department threshold alerts, telemetry refresh intervals, and report delivery channels.
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 'help' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={4}>
                <Box as="h2" fontSize="20px" fontWeight="800" color="#0f172a" mb={1}>
                  Operations Helpdesk & Escalations
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Direct escalation bridge to technical leads, department managers, and board administrators.
                </Box>
              </Box>
            </Box>
          )}

          {!['departments', 'analytics', 'reports', 'notifications', 'agents', 'projects', 'users', 'documentation', 'settings', 'help'].includes(activeTab) && (
            <OverviewView
              departmentId={selectedDept}
              currentUser={currentUser}
              dateRange={dateRange}
              setDateRange={setDateRange}
              onNavigateTab={selectMainTab}
            />
          )}
        </Box>
      </Flex>

      {/* Modals */}
      <CreateReportModal
        isOpen={isReportModalOpen}
        onClose={onCloseReportModal}
        defaultDept={selectedDept}
      />

      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={onCloseSearchModal}
        onSelectDepartment={(deptId) => {
          selectDepartment(deptId);
        }}
        onSelectTab={selectMainTab}
      />
    </Flex>
  );
};

export default CooTwoDashboard;
