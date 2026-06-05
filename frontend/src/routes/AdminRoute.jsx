import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** Renders children only for ADMIN users; redirects others to /dashboard */
export default function AdminRoute({ children }) {
  const { user, isInitializing } = useAuthStore();

  if (isInitializing) return null;
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
