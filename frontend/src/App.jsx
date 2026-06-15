import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreatePage from "./pages/CreatePage";
import CreateQuiz from "./pages/CreateQuiz";
import Addresource from "./pages/Addresource";
import HomePage from "./pages/HomePage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import CustomerFollowUpForm from "./components/CustomerFollowForm.jsx";
import FollowUpList from "./components/FollowUpList";
import SecondPage from "./pages/SecondPage";
import ThirdPage from "./pages/ThirdPage";
import FourthPage from "./pages/FourthPage";
import FifthPage from "./pages/FifthPage.jsx";
import QuizPage from "./pages/quizPage.jsx";
import Sdashboard from "./pages/sales/Sdashboard.jsx";
import Srequest from "./pages/sales/Srequest.jsx";
import FinanceLayout from "./pages/sales/FinanceLayout.jsx";
import PDFList from './components/PDFList';
import InfoForm from './pages/InfoForm';
import EmployeeInfoPage from './pages/EmployeeInfoPage';
import DocumentUploadForm from './components/DocumentUploadForm';
import DocumentList from './components/DocumentList';
import Category from './components/category';
import AssetCategoryPage from "./pages/AssetCategoryPage.jsx";
import AssetManagementPage from "./pages/AssetManagementPage.jsx";
import EmployeeFileUploadForm from "./pages/EmployeeFileUploadForm";
import TTV from "./pages/ttv.jsx";
import EmployeeDocumentList from './components/EmployeeDocument';
import CustomerFollowup from "./components/customer/CustomerFollowup.jsx";
import AddCustomer from "./components/customer/AddCustomer";
import CDashboard from "./components/customer/Cdashboard";
import CustomerReport from "./components/customer/CustomerReport";
import CustomerFollowupReport from "./components/customer/CustomerFollowupReport";
import VideoList from './components/customer/VideoList';
import UploadResource from './components/customer/UploadPage';
import TrainingPage from "./components/customer/TrainingPage";
import WaitingForApproval from "./pages/WaitingForApproval";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminTrainingUpload from "./pages/AdminTrainingUpload";
import AdminCustomerReport from './components/AdminCSReport.jsx';
import CustomerSettings from "./components/customer/CustomerSettings";
import ReceptionDashboard from './pages/ReceptionDashboard';
import HRTrainingPage from './pages/HRTrainingPage.jsx';
import ENISRALayout from "./components/ENSRA/ENSRALayout";
import ENISRAEnhancedDashboard from "./components/ENSRA/ENISRAEnhancedDashboard";
import ENISRANoticeBoard from "./components/ENSRA/ENSRANoticeBoard";
// import ENISRARequest from "./components/ENSRA/ENSRARequest";
import ENISRARequestEmbedded from "./components/ENSRA/ENISRARequestEmbedded";
import ENISRAFollowUp from "./components/ENSRA/ENISRAFollowUp";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import InstructorLayout from "./components/instructor/InstructorLayout";
import InstructorDashboard from "./pages/instructor/Dashboard";
import InstructorRequest from "./pages/instructor/Request";
import InstructorNoticeBoard from "./pages/instructor/NoticeBoard";
import SalesManagerLayout from "./components/salesmanager/Layout";
import SalesManagerDashboard from "./components/salesmanager/SalesManagerDashboard";
import SalesManagerProtectedRoute from "./components/salesmanager/SalesManagerProtectedRoute";
import CustomerMessagesPage from "./pages/CustomerMessagesPage.jsx";
import EmployeePayrollView from "./components/Payroll/EmployeePayrollView";
import KPIScorecardPage from "./pages/sales/KPIScorecardPage";
import CustomerKPIPage from "./pages/customer/CustomerKPIPage";

import MessagesPage from "./pages/MessagesPage";
import SalesMessagesPage from "./pages/SalesMessagesPage";
import FinanceMessagesPage from "./pages/FinanceMessagesPage";
// import ITMessagesPage from "./pages/ITMessagesPage";
import RedirectMessagesPage from "./pages/RedirectMessagesPage";
import RequestPage from "./pages/RequestPage";
import TeamRequestsPage from "./pages/sales/TeamRequestsPage.jsx";
import AppLayout from "./components/AppLayout"; // Import the new AppLayout component
import SupervisorLayout from "./pages/supervisor/SupervisorLayout.jsx";
import SupervisorDashboardPage from "./pages/supervisor/SupervisorDashboardPage.jsx";
import SupervisorAccountPage from "./pages/supervisor/SupervisorAccountPage.jsx";

const FinanceERPPage = lazy(() => import("./pages/sales/FinanceERPPage.jsx"));
const FinanceDashboardPage = lazy(() => import("./pages/sales/FinanceDashboardPage.jsx"));
const FinanceReportsPage = lazy(() => import("./pages/sales/FinanceReportsPage.jsx"));
const InventoryPage = lazy(() => import("./pages/sales/InventoryPage.jsx"));
const OrdersPage = lazy(() => import("./pages/sales/OrdersPage.jsx"));
const FinanceDemandsPage = lazy(() => import("./components/finance/DemandsPage.jsx"));
const FinancePaymentsPage = lazy(() => import("./components/finance/PaymentsPage.jsx"));
const PricingPage = lazy(() => import("./pages/sales/PricingPage.jsx"));
const RevenuePage = lazy(() => import("./pages/sales/RevenuePage.jsx"));
const PurchasePage = lazy(() => import("./pages/sales/PurchasePage.jsx"));
const CostManagementPage = lazy(() => import("./pages/sales/CostManagementPage.jsx"));
const FinancePayrollPage = lazy(() => import("./pages/sales/FinancePayrollPage.jsx"));
const CommissionApprovalPage = lazy(() => import("./pages/sales/CommissionApprovalPage.jsx"));
const B2BDashboard = lazy(() => import("./pages/B2BDashboard"));
const COODashboard = lazy(() => import("./pages/COODashboard"));
const TradexTVDashboard = lazy(() => import("./pages/TradexTVDashboard"));
const ITDashboard = lazy(() => import("./pages/ITDashboard"));
const SocialMediaDashboardPage = lazy(() => import("./pages/socialmedia/SocialMediaDashboardPage"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const PayrollPage = lazy(() => import("./components/Payroll/PayrollPage"));
const AllSalesPage = lazy(() => import("./components/salesmanager/AllSalesPage"));
const PerformancePage = lazy(() => import("./components/salesmanager/PerformancePage"));
const TeamManagementPage = lazy(() => import("./components/salesmanager/TeamManagementPage"));
const TaskManagementPage = lazy(() => import("./components/salesmanager/TaskManagementPage"));
const ReportsPage = lazy(() => import("./components/salesmanager/ReportsPage"));
const CalendarPage = lazy(() => import("./components/salesmanager/CalendarPage"));
const SettingsPage = lazy(() => import("./components/salesmanager/SettingsPage"));
const ContentTrackerReport = lazy(() => import("./components/salesmanager/ContentTrackerReport"));
const CourseManagerPage = lazy(() => import("./components/salesmanager/CourseManagerPage"));

function App() {
  const location = useLocation();

  // Define the paths where Sidebar and Navbar should not appear
  const noNavSidebarRoutes = [
    "/", "/login", "/secondpage", "/employee-info", "/employee-file-upload", 
    "/thirdpage", "/ttv", "/fourthpage", "/fifthpage", "/exam", "/sdashboard", "/sales", "/sales/dashboard", "/finance-dashboard", "/finance-dashboard/reports",
    "/finance-dashboard/inventory", "/finance-dashboard/orders", "/finance-dashboard/pricing", "/finance-dashboard/revenue", "/finance-dashboard/purchase",
    "/finance/messages", "/finance/team-requests", "/finance/demands", "/finance/payments", "/finance/inventory", "/finance/orders",
    "/addcustomer", "/resource", "/videolist", "/uploadpage", "/my-payroll",
    "/cdashboard", "/waitingforapproval", "/training","/comingsoonpage", "/customerreport", "/followup-report", "/customerfollowup", "/b2b-dashboard",
    "/coo-dashboard", "/ceo-dashboard", "/tradextv-dashboard", "/customer-settings", "/it", "/salesmanager", "/social-media", "/requests", "/finance-dashboard/payroll", "/finance-dashboard/commission-approval", "/supervisor", "/supervisor/account", "/finance/requests", "/reception-dashboard"
  ].map((path) => path.toLowerCase());

  // Hide the navbar and sidebar for legacy/fullscreen pages; root should only match exactly
  const normalizedPath = location.pathname.toLowerCase();
  const showNavAndSidebar = !noNavSidebarRoutes.some((route) => {
    if (route === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath.startsWith(route);
  });

  // Wrapper component that conditionally applies the layout
  const LayoutWrapper = ({ children }) => {
    if (showNavAndSidebar) {
      return <AppLayout>{children}</AppLayout>;
    }
    return children;
  };

return (
    <Suspense fallback={<div style={{ padding: "24px" }}>Loading...</div>}>
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/InfoForm" element={<InfoForm />} />
      <Route path="/secondpage" element={<SecondPage />} />
      <Route path="/thirdpage" element={<ThirdPage />} />
      <Route path="/fourthpage" element={<FourthPage />} />
      <Route path="/fifthpage" element={<FifthPage />} />
      <Route path="/exam" element={<QuizPage />} />
      <Route path="/WaitingForApproval" element={<WaitingForApproval />} />
      <Route path="/sdashboard" element={<Sdashboard />} />
      <Route path="/sales" element={<Sdashboard />} />
      <Route path="/sales/dashboard" element={<Sdashboard />} />
      <Route path="/srequest" element={<Srequest />} />
      <Route path="/finance-dashboard" element={<FinanceLayout><FinanceDashboardPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/erp" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/accounting" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/sales-finance" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/purchase-finance" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/bank-cash" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/expenses" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/tax" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/settings" element={<FinanceLayout><FinanceERPPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/reports" element={<FinanceLayout><FinanceReportsPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/inventory" element={<FinanceLayout><InventoryPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/orders" element={<FinanceLayout><OrdersPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/demands" element={<FinanceLayout><FinanceDemandsPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/payments" element={<FinanceLayout><FinancePaymentsPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/pricing" element={<FinanceLayout><PricingPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/create-course" element={<FinanceLayout><PricingPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/revenue" element={<FinanceLayout><RevenuePage /></FinanceLayout>} />
      <Route path="/finance-dashboard/purchase" element={<FinanceLayout><PurchasePage /></FinanceLayout>} />
      <Route path="/finance-dashboard/costs" element={<FinanceLayout><CostManagementPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/payroll" element={<FinanceLayout><FinancePayrollPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/commission-approval" element={<FinanceLayout><CommissionApprovalPage /></FinanceLayout>} />
      <Route path="/finance/inventory" element={<Navigate to="/finance-dashboard/inventory" replace />} />
      <Route path="/finance/orders" element={<Navigate to="/finance-dashboard/orders" replace />} />
      <Route path="/finance/demands" element={<Navigate to="/finance-dashboard/demands" replace />} />
      <Route path="/finance/payments" element={<Navigate to="/finance-dashboard/payments" replace />} />
      <Route path="/finance/team-requests" element={<FinanceLayout><TeamRequestsPage /></FinanceLayout>} />
      <Route
        path="/finance/messages"
        element={
          <FinanceLayout>
            <FinanceMessagesPage embedded />
          </FinanceLayout>
        }
      />
      <Route path="/resource" element={<Navigate to="/resources" replace />} />
      <Route path="/employee-info" element={<EmployeeInfoPage />} />
      <Route path="/employee-file-upload" element={<EmployeeFileUploadForm />} />
      <Route path="/users" element={<LayoutWrapper><HomePage /></LayoutWrapper>} />
      <Route path="/dashboard" element={<LayoutWrapper><Dashboard /></LayoutWrapper>} />
      <Route path="/course" element={<LayoutWrapper><AdminTrainingUpload /></LayoutWrapper>} />
      <Route path="/hr-training" element={<LayoutWrapper><HRTrainingPage /></LayoutWrapper>} />
      <Route path="/documentupload" element={<DocumentUploadForm />} />
      <Route path="/category" element={<LayoutWrapper><Category /></LayoutWrapper>} />
      <Route path="/documentlist" element={<LayoutWrapper><DocumentList /></LayoutWrapper>} />
      <Route path="/EmployeeDocument" element={<LayoutWrapper><EmployeeDocumentList /></LayoutWrapper>} />
      <Route path="/documentlist/:id" element={<LayoutWrapper><DocumentList /></LayoutWrapper>} />
      <Route path="/create" element={<LayoutWrapper><CreatePage /></LayoutWrapper>} />
      <Route path="/quiz" element={<LayoutWrapper><CreateQuiz /></LayoutWrapper>} />
      <Route path="/resources" element={<LayoutWrapper><PDFList /></LayoutWrapper>} />
      <Route path="/Addresource" element={<LayoutWrapper><Addresource /></LayoutWrapper>} />
      <Route
        path="/FollowUpList"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <FollowUpList />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/CustomerFollowUpForm"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowUpForm />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/assetcategory" element={<LayoutWrapper><AssetCategoryPage /></LayoutWrapper>} />
      <Route path="/assets" element={<LayoutWrapper><AssetManagementPage /></LayoutWrapper>} />
      <Route path="/ttv" element={<TTV />} />
      <Route path="/PDF" element={<LayoutWrapper><PDFList /></LayoutWrapper>} />
      <Route
        path="/CustomerFollowup"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowup />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/AddCustomer"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AddCustomer />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/VideoList"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <VideoList />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/UploadPage"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <UploadResource />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/Cdashboard"
        element={
          <ProtectedRoute>
            <CDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/CustomerReport"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/followup-report"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowupReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <TrainingPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/ComingSoonPage" element={<ComingSoonPage />} />
      <Route
        path="/admin-training-upload"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AdminTrainingUpload />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/adminCustomerReport"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AdminCustomerReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/b2b-dashboard" element={<B2BDashboard />} />
      <Route path="/coo-dashboard" element={<COODashboard />} />
      <Route path="/ceo-dashboard" element={<COODashboard />} />
      <Route path="/tradextv-dashboard" element={<TradexTVDashboard />} />
      <Route path="/reception-dashboard" element={<LayoutWrapper><ReceptionDashboard /></LayoutWrapper>} />
      <Route
        path="/customer-settings"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerSettings />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/social-media"
        element={
          <RoleProtectedRoute allowedRoles={["socialmediamanager", "socialmedia"]}>
            <LayoutWrapper>
              <SocialMediaDashboardPage />
            </LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route path="/requests" element={<LayoutWrapper><RequestPage /></LayoutWrapper>} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <ChatPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/sales/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/finance/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/customer/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/salesmanager/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/supervisor/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/finance/requests" element={<FinanceLayout><RequestPage /></FinanceLayout>} />
      <Route path="/it" element={<ITDashboard />} />
      <Route
        path="/instructor"
        element={
          <RoleProtectedRoute allowedRoles={["instructor"]}>
            <InstructorLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="request" element={<InstructorRequest />} />
        <Route path="notice-board" element={<InstructorNoticeBoard />} />
      </Route>

      {/* ENISRA section */}
      <Route path="/enisra" element={<ENISRALayout />}>
        <Route index element={<ENISRAEnhancedDashboard />} />
        <Route path="dashboard" element={<ENISRAEnhancedDashboard />} />
        <Route path="follow-up" element={<ENISRAFollowUp />} />
        <Route path="notice-board" element={<ENISRANoticeBoard />} />
        <Route path="request" element={<ENISRARequestEmbedded />} />
      </Route>
      <Route path="/payroll" element={<LayoutWrapper><PayrollPage /></LayoutWrapper>} />
      <Route path="/my-payroll" element={<EmployeePayrollView />} />
      <Route path="/messages" element={<RedirectMessagesPage />} />
      <Route path="/sales/messages" element={<SalesMessagesPage />} />
      <Route path="/customer/messages" element={<CustomerMessagesPage />} />
      <Route path="/customer/kpi" element={<CustomerKPIPage />} />
      <Route path="/supervisor" element={<SupervisorLayout />}>
        <Route index element={<SupervisorDashboardPage />} />
        <Route path="requests" element={<TeamRequestsPage />} />
        <Route path="notice-board" element={<FinanceMessagesPage embedded />} />
        <Route path="revenue-expense" element={<RevenuePage />} />
      </Route>
      <Route path="/supervisor/account" element={<SupervisorAccountPage />} />
      <Route
        path="/salesmanager/*"
        element={
          <SalesManagerProtectedRoute>
            <SalesManagerLayout />
          </SalesManagerProtectedRoute>
        }
      >
        <Route index element={<SalesManagerDashboard />} />
        <Route path="dashboard" element={<SalesManagerDashboard />} />
        <Route path="course" element={<CourseManagerPage />} />
        <Route path="all-sales" element={<AllSalesPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="kpi" element={<KPIScorecardPage />} />
        <Route path="team" element={<TeamManagementPage />} />
        <Route path="tasks" element={<TaskManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="it-report" element={<ReportsPage />} />
        <Route path="content-tracker-report" element={<ContentTrackerReport />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="trainings" element={<TrainingPage />} />
        
      </Route>
    </Routes>
    </Suspense>
  );
}

export default App;
