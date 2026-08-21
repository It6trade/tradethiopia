import React, { useState, useEffect } from "react";
import { Box, Drawer, DrawerOverlay, DrawerContent, useDisclosure, Text } from "@chakra-ui/react";
import SSidebar from "./Ssidebar";
import SNavbar from "./Snavbar";
import FollowupPage from "./FollowupPage";
import PackageSalesPage from "./PackageSalesPage";
import Training from "./Training.jsx";
import PDFList from '../PDFList';
import Dashboard from './SalesDashboard.jsx';
// import FinanceDashboard from './FinanceDashboard.jsx'; // Replaced with dedicated page
import OrderFollowup from './OrderFollowup.jsx';
import SalesTargetsPage from './SalesTargetsPage.jsx';
import TaskDashboard from './TaskDashboard.jsx';
import MonthlyReport from './MonthlyReport.jsx';
import SalesMessagesPage from '../../pages/SalesMessagesPage';
import EmployeeRequestsPage from '../../pages/EmployeeRequestsPage';
import EmployeeInfoPage from '../../pages/EmployeeInfoPage';
import EmployeeFileUploadForm from '../../pages/EmployeeFileUploadForm';
import EmployeeWarningsPage from '../../pages/EmployeeWarningsPage';
import ContentTrackerPage from './ContentTrackerPage.jsx';
import { useUserStore } from '../../store/user';
import { getUserDepartment } from '../../utils/department';
import useIsMobile from '../../hooks/useIsMobile';
import MobileSalesShell from '../../mobile/sales/MobileSalesShell';

const DESKTOP_NAV_HEIGHT = '80px';

const Layout = ({ children, initialActiveItem }) => {
  const { isOpen, onOpen, onClose } = useDisclosure(); // For controlling the drawer

  // Load initial state from localStorage or default to 'Home'
  const getInitialActiveItem = () => {
    if (initialActiveItem) {
      return initialActiveItem;
    }
    const savedItem = localStorage.getItem('salesActiveItem');
    if (savedItem === 'Requests' || savedItem === 'Personal Information' || savedItem === 'Tutorials') {
      localStorage.removeItem('salesActiveItem');
      return 'Home';
    }
    return savedItem || 'Home';
  };
  
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(getInitialActiveItem);
  const isMobile = useIsMobile();

  // Save activeItem to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('salesActiveItem', activeItem);
  }, [activeItem]);

  const currentUser = useUserStore((state) => state.currentUser);
  const userDepartment = getUserDepartment(currentUser) || 'sales';

  const renderContent = () => {
    switch (activeItem) {
      case 'Home':
        return <Dashboard />;
      case 'Followup':
        return <FollowupPage />;
      case 'Package Sales':
        return <PackageSalesPage />;
      case 'Resources':
        return <PDFList />;
      case 'Finance':
        // Navigate to the dedicated finance dashboard page
        window.location.href = '/finance-dashboard';
        return null;
      case 'Financial Reports':
        window.location.href = '/finance-dashboard/reports';
        return null;
      case 'Orders':
        return <OrderFollowup />;
      case 'Users':
        return <Box p={6}><Text fontSize="xl">Users section</Text></Box>;
      case 'Targets':
        return <SalesTargetsPage />;
      case 'Tasks':
        return <TaskDashboard />;
      case 'Monthly Report':
        return <MonthlyReport />;
      case 'Notice Board':
        return <SalesMessagesPage />;
      case 'Requests':
        return <EmployeeRequestsPage />;
      case 'Upload Documents':
        return <EmployeeFileUploadForm embedded />;
      case 'My Warnings':
        return <EmployeeWarningsPage mode="employee" />;
      case 'Content Tracker':
        return <ContentTrackerPage />;
      default:
        return <Box p={6}><Text fontSize="xl">Select an option from the Sidebar.</Text></Box>;
    }
  };

  if (isMobile) {
    return <MobileSalesShell activeItem={activeItem} setActiveItem={setActiveItem} />;
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Navbar */}
      <Box position="fixed" top={0} left={0} width="100%" zIndex="1000">
        <SNavbar onToggleSidebar={onOpen} /> {/* Pass `onOpen` to toggle the drawer */}
      </Box>

      {/* Main Container */}
      <Box display="flex" flex="1" pt={DESKTOP_NAV_HEIGHT}>
        {/* Sidebar for Larger Screens */}
        <Box
          position="fixed"
          top={DESKTOP_NAV_HEIGHT}
          left={0}
          width={isSidebarCollapsed ? "70px" : "200px"}
          height={`calc(100vh - ${DESKTOP_NAV_HEIGHT})`} // Adjust height to account for the navbar
          transition="width 0.3s"
          display={{ base: "none", md: "block" }} // Hide on mobile
          zIndex="900" // Ensure it's below the navbar but above other content
        >
          <SSidebar
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </Box>

        {/* Drawer for Mobile Screens */}
        <Drawer isOpen={isOpen} onClose={onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <SSidebar
              isCollapsed={false}
              toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
            />
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box
          ml={{
            base: 0, // No margin on mobile
            md: isSidebarCollapsed ? "70px" : "200px", // Adjust for collapsed or expanded sidebar on larger screens
          }}
          transition="margin-left 0.3s"
          p={4}
          bg="#f8f9fa"
          flex="1"
          width="100%" // Ensure it takes up the remaining space
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
