import api from './axios';

export const insightsApi = {
  // Recommendations & challenges
  getRecommendations:  ()   => api.get('/insights/recommendations'),
  getChallenges:       ()   => api.get('/insights/challenges'),
  joinChallenge:       (id) => api.post(`/insights/challenges/${id}/join`),
  completeChallenge:   (id) => api.patch(`/insights/challenges/${id}/complete`),
  leaveChallenge:      (id) => api.delete(`/insights/challenges/${id}/leave`),
  getOffsetProjects:   ()   => api.get('/insights/offset-projects'),

  // AI features
  generateReport:      ()   => api.post('/insights/report'),
  getSuggestedGoals:   ()   => api.post('/insights/goals'),
  suggestChallenge:    ()   => api.post('/insights/challenge-suggestion'),

  // ML Forecasting (NEW)
  getForecast:         (months = 12) => api.get(`/insights/forecast?months=${months}`),
  compareModels:       () => api.get('/insights/compare-models'),
  checkMLServiceHealth: () => api.get('/insights/ml-health'),
};
