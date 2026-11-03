import api from './axios';

export const adminApi = {
  /** Organisation summary: name, member / admin / suspended counts */
  getOrganization: () => api.get('/admin/organization'),

  /** List the organisation's users with carbon totals, points and badges */
  listUsers: () => api.get('/admin/users'),

  /** Add a member  { name, email, password, role } */
  createUser: (body) => api.post('/admin/users', body),

  /** Promote or demote a user  role: 'ADMIN' | 'USER' */
  updateRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),

  /** Suspend (false) or reactivate (true) an account */
  updateStatus: (userId, active) => api.patch(`/admin/users/${userId}/status`, { active }),

  /** Delete a user */
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  /** Give a user an award  { title, icon, points, reason } */
  giveAward: (userId, body) => api.post(`/admin/users/${userId}/awards`, body),

  /** Revoke an award */
  revokeAward: (awardId) => api.delete(`/admin/awards/${awardId}`),
};
