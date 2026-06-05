import { Routes, Route } from 'react-router-dom';
import LandingPage     from '../pages/landing/LandingPage';
import LoginPage       from '../pages/auth/LoginPage';
import SignupPage      from '../pages/auth/SignupPage';
import FeaturesPage    from '../pages/features/FeaturesPage';
import HowItWorksPage  from '../pages/how-it-works/HowItWorksPage';
import CalculatorPage  from '../pages/calculator/CalculatorPage';
import AboutPage       from '../pages/about/AboutPage';
import ContactPage     from '../pages/contact/ContactPage';

import OnboardingPage  from '../pages/onboarding/OnboardingPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome   from '../pages/dashboard/DashboardHome';
import ActivitiesPage  from '../pages/dashboard/ActivitiesPage';
import AnalyticsPage   from '../pages/dashboard/AnalyticsPage';
import ChatPage        from '../pages/dashboard/ChatPage';
import InsightsPage    from '../pages/dashboard/InsightsPage';
import AdminPage       from '../pages/dashboard/AdminPage';

import ProtectedRoute  from './ProtectedRoute';
import AdminRoute      from './AdminRoute';
import PublicRoute     from './PublicRoute';
import Navbar          from '../components/layout/Navbar';

function PublicPageLayout({ children }) {
  return <><Navbar />{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Public info pages */}
      <Route path="/features"     element={<PublicPageLayout><FeaturesPage /></PublicPageLayout>} />
      <Route path="/how-it-works" element={<PublicPageLayout><HowItWorksPage /></PublicPageLayout>} />
      <Route path="/calculator"   element={<PublicPageLayout><CalculatorPage /></PublicPageLayout>} />
      <Route path="/about"        element={<PublicPageLayout><AboutPage /></PublicPageLayout>} />
      <Route path="/contact"      element={<PublicPageLayout><ContactPage /></PublicPageLayout>} />

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
        <Route path="admin"          element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
