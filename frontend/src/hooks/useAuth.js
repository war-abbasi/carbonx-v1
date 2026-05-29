import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';

export function useAuth() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      login(data.data.user, data.data.token);
      toast.success(`Welcome back, ${data.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const { data } = await authApi.register({ name, email, password });
      login(data.data.user, data.data.token);
      toast.success('Account created! Welcome to CarbonX.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  return { user, isAuthenticated, isLoading: loading || isLoading, handleLogin, handleRegister, handleLogout };
}
