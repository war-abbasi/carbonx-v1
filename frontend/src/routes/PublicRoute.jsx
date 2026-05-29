import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PublicRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}
