import api from './axios';

export const carbonApi = {
  /** Submit a new carbon entry */
  submitEntry: (data) => api.post('/carbon/entries', data),

  /** Get own entries */
  getMyEntries: (limit = 20) => api.get(`/carbon/entries?limit=${limit}`),

  /** Get own summary (totals by category/scope) */
  getSummary: () => api.get('/carbon/summary'),

  /** Get leaderboard  period: 'all' | 'week' | 'month' */
  getLeaderboard: (period = 'all') => api.get(`/carbon/leaderboard?period=${period}`),

  /** Get emission factor catalogue */
  getFactors: () => api.get('/carbon/factors'),
};
