import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import NotificationsPage from './pages/NotificationsPage';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Billing from './pages/Billing';
import VendorPortal from './pages/VendorPortal';
import MaterialsPortal from './pages/MaterialsPortal';
import EquipmentPortal from './pages/EquipmentPortal';
import TeamPanel from './pages/TeamPanel';
import ChatBox from './pages/ChatBox';

import ProjectLayout, { ProjectOverview } from './pages/project/ProjectLayout';
import DailyLogs from './pages/project/DailyLogs';
import LogForm from './pages/project/LogForm';
import LogDetail from './pages/project/LogDetail';
import Attendance from './pages/project/Attendance';
import Materials from './pages/project/Materials';
import Expenses from './pages/project/Expenses';
import BudgetDashboard from './pages/project/BudgetDashboard';
import Milestones from './pages/project/Milestones';
import DocumentManager from './pages/project/DocumentManager';
import OwnerDashboard from './pages/project/OwnerDashboard';
import PublicOwnerDashboard from './pages/PublicOwnerDashboard';
import Issues from './pages/project/Issues';
import Gallery from './pages/project/Gallery';

import ParticleBackground from './components/common/ParticleBackground';

export default function App() {
  return (
    <ThemeProvider>
      <ParticleBackground />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            <Route path="/owner/:shareToken" element={<PublicOwnerDashboard />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/users" element={<Navigate to="/team" replace />} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/vendor" element={<ProtectedRoute><VendorPortal /></ProtectedRoute>} />
            <Route path="/materials" element={<ProtectedRoute><MaterialsPortal /></ProtectedRoute>} />
            <Route path="/equipment" element={<ProtectedRoute><EquipmentPortal /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamPanel /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatBox /></ProtectedRoute>} />

            <Route path="/projects/:id/logs/new" element={<ProtectedRoute><LogForm /></ProtectedRoute>} />
            <Route path="/projects/:id/logs/:logId" element={<ProtectedRoute><LogDetail /></ProtectedRoute>} />

            <Route path="/projects/:id" element={<ProtectedRoute><ProjectLayout /></ProtectedRoute>}>
              <Route index element={<ProjectOverview />} />
              <Route path="logs" element={<DailyLogs />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="materials" element={<Materials />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="budget" element={<BudgetDashboard />} />
              <Route path="milestones" element={<Milestones />} />
              <Route path="documents" element={<DocumentManager />} />
              <Route path="issues" element={<Issues />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="owner" element={<OwnerDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
