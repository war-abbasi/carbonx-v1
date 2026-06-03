import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Redirect to onboarding if not completed yet
  const onboardingDone = localStorage.getItem('carbonx_onboarding') === 'done';
  if (!onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
