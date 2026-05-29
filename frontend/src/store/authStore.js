import { create } from 'zustand';
import { authApi } from '../api/authApi';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),

  login: (user, token) => {
    localStorage.setItem('carbonx_token', token);
    set({ user, token, isAuthenticated: true, error: null });
  },

  logout: () => {
    localStorage.removeItem('carbonx_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  loadUser: async () => {
    const token = localStorage.getItem('carbonx_token');
    if (!token) {
      set({ isInitializing: false });
      return;
    }
    try {
      const { data } = await authApi.getMe();
      set({
        user: data.data,
        token,
        isAuthenticated: true,
        isInitializing: false,
      });
    } catch {
      localStorage.removeItem('carbonx_token');
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
