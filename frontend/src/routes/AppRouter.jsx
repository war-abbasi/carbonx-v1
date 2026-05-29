import { Routes, Route } from 'react-router-dom';
import LandingPage      from '../pages/landing/LandingPage';
import LoginPage        from '../pages/auth/LoginPage';
import SignupPage       from '../pages/auth/SignupPage';
import DashboardHome    from '../pages/dashboard/DashboardHome';
import DashboardLayout  from '../components/layout/DashboardLayout';
import FeaturesPage     from '../pages/features/FeaturesPage';
import HowItWorksPage   from '../pages/how-it-works/HowItWorksPage';
import CalculatorPage   from '../pages/calculator/CalculatorPage';
import AboutPage        from '../pages/about/AboutPage';
import ContactPage      from '../pages/contact/ContactPage';
import ProtectedRoute   from './ProtectedRoute';
import PublicRoute      from './PublicRoute';

/* Public layout wrapper — wraps pages that need Navbar but are NOT the landing page */
import Navbar from '../components/layout/Navbar';

function PublicPageLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Landing (has its own Navbar via Footer/Navbar import) */}
      <Route path="/" element={<LandingPage />} />

      {/* Public info pages */}
      <Route
        path="/features"
        element={
          <PublicPageLayout>
            <FeaturesPage />
          </PublicPageLayout>
        }
      />
      <Route
        path="/how-it-works"
        element={
          <PublicPageLayout>
            <HowItWorksPage />
          </PublicPageLayout>
        }
      />
      <Route
        path="/calculator"
        element={
          <PublicPageLayout>
            <CalculatorPage />
          </PublicPageLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PublicPageLayout>
            <AboutPage />
          </PublicPageLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicPageLayout>
            <ContactPage />
          </PublicPageLayout>
        }
      />

      {/* Auth */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
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
        <Route index element={<DashboardHome />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
