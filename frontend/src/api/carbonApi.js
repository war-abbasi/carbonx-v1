import api from './axios';

export const carbonApi = {
  /** Submit a new carbon entry */
  submitEntry: (data) => api.post('/carbon/entries', data),

  /** Edit an existing entry */
  updateEntry: (id, data) => api.patch(`/carbon/entries/${id}`, data),

  /** Delete an entry */
  deleteEntry: (id) => api.delete(`/carbon/entries/${id}`),

  /** Get own entries */
  getMyEntries: (limit = 20) => api.get(`/carbon/entries?limit=${limit}`),

  /** Get own summary (totals by category/scope) */
  getSummary: () => api.get('/carbon/summary'),

  /** Get leaderboard  period: 'all' | 'week' | 'month' */
  getLeaderboard: (period = 'all') => api.get(`/carbon/leaderboard?period=${period}`),

  /** Get analytics  period: 'year' | '6months' | '30days' | '7days' */
  getAnalytics: (period = 'year') => api.get(`/carbon/analytics?period=${period}`),

  /** Get linear-regression emission forecast  months: 1–12 */
  getForecast: (months = 6) => api.get(`/carbon/forecast?months=${months}`),

  /** Admin: bulk upload parsed CSV rows as JSON */
  bulkUpload: (entries) => api.post('/carbon/bulk-upload', { entries }),

  /** Get emission factor catalogue */
  getFactors: () => api.get('/carbon/factors'),
};
