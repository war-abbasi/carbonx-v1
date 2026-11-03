import api from './axios';

/* AI + ML forecasting calls can take longer than the default 10s */
const SLOW = { timeout: 90000 };

export const insightsApi = {
  // Recommendations & challenges
  getRecommendations:  ()   => api.get('/insights/recommendations', SLOW),
  getChallenges:       ()   => api.get('/insights/challenges'),
  joinChallenge:       (id) => api.post(`/insights/challenges/${id}/join`),
  completeChallenge:   (id) => api.patch(`/insights/challenges/${id}/complete`),
  leaveChallenge:      (id) => api.delete(`/insights/challenges/${id}/leave`),
  getOffsetProjects:   ()   => api.get('/insights/offset-projects'),

  // AI features
  generateReport:      ()   => api.post('/insights/report', null, SLOW),
  getSuggestedGoals:   ()   => api.post('/insights/goals', null, SLOW),
  suggestChallenge:    ()   => api.post('/insights/challenge-suggestion', null, SLOW),

  // ML Forecasting (NEW)
  getForecast:         (months = 12, refresh = false) =>
                         api.get(`/insights/forecast?months=${months}${refresh ? '&refresh=true' : ''}`, SLOW),
  compareModels:       () => api.get('/insights/compare-models', SLOW),
  checkMLServiceHealth: () => api.get('/insights/ml-health'),
};
