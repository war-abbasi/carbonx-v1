import api from './axios';

export const adminApi = {
  /** List all users with their carbon totals */
  listUsers: () => api.get('/admin/users'),

  /** Promote or demote a user  role: 'ADMIN' | 'USER' */
  updateRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),

  /** Delete a user */
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};
