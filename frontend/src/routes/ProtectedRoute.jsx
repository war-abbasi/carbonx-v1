import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuthStore();
  const location = useLocation();

  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Admins always skip onboarding — they access the platform directly
  const isAdmin      = user?.role === 'ADMIN';
  const onboardingDone = isAdmin || localStorage.getItem('carbonx_onboarding') === 'done';

  if (!onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
