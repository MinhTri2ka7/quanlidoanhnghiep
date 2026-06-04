import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import OtpVerifyPage from "./pages/OtpVerifyPage.jsx";
import DashboardLayout from "./components/dashboard/DashboardLayout.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";
import TeamsPage from "./pages/dashboard/TeamsPage.jsx";
import TeamDetailPage from "./pages/dashboard/TeamDetailPage.jsx";
import EmployeesPage from "./pages/dashboard/EmployeesPage.jsx";
import EmployeeDetailPage from "./pages/dashboard/EmployeeDetailPage.jsx";
import ProjectsPage from "./pages/dashboard/ProjectsPage.jsx";
import ProjectDetailPage from "./pages/dashboard/ProjectDetailPage.jsx";
import TasksPage from "./pages/dashboard/TasksPage.jsx";
import ChatPage from "./pages/dashboard/ChatPage.jsx";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage.jsx";
import SecurityPage from "./pages/dashboard/SecurityPage.jsx";
import AuditLogsPage from "./pages/dashboard/AuditLogsPage.jsx";
import BillingPage from "./pages/dashboard/BillingPage.jsx";
import SettingsPage from "./pages/dashboard/SettingsPage.jsx";
import WorkspacePage from "./pages/dashboard/WorkspacePage.jsx";

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/otp-verify" element={<OtpVerifyPage />} />

      {/* Dashboard routes - Hierarchical structure */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        {/* Workspace Level */}
        <Route index element={<DashboardHome />} />
        <Route path="workspace" element={<WorkspacePage />} />

        {/* Team Level */}
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:teamId" element={<TeamDetailPage />} />

        {/* Employee Level */}
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/:employeeId" element={<EmployeeDetailPage />} />

        {/* Project Level */}
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />

        {/* Task Level */}
        <Route path="tasks" element={<TasksPage />} />

        {/* Communication */}
        <Route path="chat" element={<ChatPage />} />

        {/* System */}
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="logs" element={<AuditLogsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
