import { authApi } from '../api/authApi';

export const authService = {
  async login(credentials) {
    const { data } = await authApi.login(credentials);
    return data;
  },

  async register(userData) {
    const { data } = await authApi.register(userData);
    return data;
  },

  async getCurrentUser() {
    const { data } = await authApi.getMe();
    return data;
  },
};
