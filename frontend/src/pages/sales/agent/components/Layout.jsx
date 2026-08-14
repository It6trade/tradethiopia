import React, { useState, useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import SSidebar from "./Ssidebar";
import SNavbar from "./Snavbar";
import FollowupPage from "./FollowupPage";
import PackageSalesPage from "./PackageSalesPage";
import Training from "./Training.jsx";
import PDFList from '../../../../components/PDFList';
import Dashboard from './HomeView.jsx';
import OrderFollowup from './OrderFollowup.jsx';
import SalesTargetsPage from './SalesTargetsPage.jsx';
import TaskDashboard from './TaskDashboard.jsx';
import MonthlyReport from './MonthlyReport.jsx';
import SalesMessagesPage from '../../../SalesMessagesPage';
import RequestPage from '../../../RequestPage';
import ContentTrackerPage from './ContentTrackerPage.jsx';
import { useUserStore } from '../../../../store/user';
import { getUserDepartment } from '../../../../utils/department';
import useIsMobile from '../../../../hooks/useIsMobile';
import MobileSalesShell from '../../../../mobile/sales/MobileSalesShell';
import { initPushNotifications } from '../../../../services/notificationService';

const Layout = ({ children, initialActiveItem }) => {
  const { colorMode } = useColorMode();
  
  // Sync theme mode state and initialize web push notifications
  useEffect(() => {
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [colorMode]);

  useEffect(() => {
    // Register sw and request subscription if permission is granted
    initPushNotifications().catch(err => console.error('[Push] Init error:', err));
  }, []);

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load initial state from localStorage or default to 'Home'
  const getInitialActiveItem = () => {
    if (initialActiveItem) {
      return initialActiveItem;
    }
    const savedItem = localStorage.getItem('salesActiveItem');
    if (savedItem === 'Requests') {
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
        window.location.href = '/finance-dashboard';
        return null;
      case 'Financial Reports':
        window.location.href = '/finance-dashboard/reports';
        return null;
      case 'Orders':
        return <OrderFollowup />;
      case 'Users':
        return <div className="p-6"><h2 className="text-xl font-bold">Users section</h2></div>;
      case 'Tutorials':
        return <Training />;
      case 'Targets':
        return <SalesTargetsPage />;
      case 'Tasks':
        return <TaskDashboard />;
      case 'Monthly Report':
        return <MonthlyReport />;
      case 'Notice Board':
        return <SalesMessagesPage />;
      case 'Requests':
        return <RequestPage />;
      case 'Content Tracker':
        return <ContentTrackerPage />;
      default:
        return <div className="p-6"><h2 className="text-xl font-bold">Select an option from the Sidebar.</h2></div>;
    }
  };

  if (isMobile) {
    return <MobileSalesShell activeItem={activeItem} setActiveItem={setActiveItem} />;
  }

  return (
    <div className="flex h-screen overflow-hidden !bg-slate-50 dark:!bg-slate-900 text-slate-700 dark:text-slate-200">
      
      {/* Left Sidebar for Desktop Viewports */}
      <aside 
        className={`h-screen hidden md:block overflow-hidden transition-all duration-300 flex-shrink-0 ${
          isSidebarCollapsed ? "w-[70px]" : "w-[200px]"
        }`}
      >
        <SSidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />
      </aside>

      {/* Right side container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Navbar */}
        <SNavbar onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 !bg-slate-50 dark:!bg-slate-950/20">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Drawer Slide-out Layout */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />
          {/* Slide-out Sidebar Panel */}
          <div className="relative w-64 max-w-xs bg-[#0b1329] shadow-xl flex flex-col h-full z-50">
            <SSidebar
              isCollapsed={false}
              toggleCollapse={() => setIsMobileMenuOpen(false)}
              activeItem={activeItem}
              setActiveItem={(item) => {
                setActiveItem(item);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Layout;
