import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage     from '../pages/landing/LandingPage';
import LoginPage       from '../pages/auth/LoginPage';
import SignupPage      from '../pages/auth/SignupPage';

import OnboardingPage  from '../pages/onboarding/OnboardingPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome   from '../pages/dashboard/DashboardHome';
import ActivitiesPage  from '../pages/dashboard/ActivitiesPage';
import AnalyticsPage   from '../pages/dashboard/AnalyticsPage';
import ChatPage        from '../pages/dashboard/ChatPage';
import InsightsPage    from '../pages/dashboard/InsightsPage';
import CarboncastXPage from '../pages/dashboard/CarboncastXPage';
import SettingsPage    from '../pages/dashboard/SettingsPage';
import AdminPage       from '../pages/dashboard/AdminPage';

import ProtectedRoute  from './ProtectedRoute';
import AdminRoute      from './AdminRoute';
import PublicRoute     from './PublicRoute';

export default function AppRouter() {
  return (
    <Routes>
      {/* Landing — single one-pager */}
      <Route path="/" element={<LandingPage />} />

      {/* Redirect old standalone pages to home */}
      <Route path="/features"     element={<Navigate to="/" replace />} />
      <Route path="/how-it-works" element={<Navigate to="/" replace />} />
      <Route path="/calculator"   element={<Navigate to="/" replace />} />
      <Route path="/about"        element={<Navigate to="/" replace />} />
      <Route path="/contact"      element={<Navigate to="/" replace />} />

      {/* Auth */}
      <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Onboarding — protected but outside dashboard layout */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index                 element={<DashboardHome />} />
        <Route path="activities"     element={<ActivitiesPage />} />
        <Route path="analytics"      element={<AnalyticsPage />} />
        <Route path="chat"           element={<ChatPage />} />
        <Route path="insights"       element={<InsightsPage />} />
        <Route path="carboncastx"    element={<CarboncastXPage />} />
        <Route path="settings"       element={<SettingsPage />} />
        <Route path="admin"          element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
