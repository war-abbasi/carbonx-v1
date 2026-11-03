const { Router }       = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getRecommendations,
  listChallenges, joinChallenge, completeChallenge, leaveChallenge,
  getOffsetProjects,
  generateReport, getSuggestedGoals, suggestChallenge,
  getForecast, compareModels, checkMLServiceHealth, getAwards,
} = require('../controllers/insightsController');

const router = Router();
router.use(authenticate);

router.get('/recommendations',              getRecommendations);
router.get('/challenges',                   listChallenges);
router.post('/challenges/:id/join',         joinChallenge);
router.patch('/challenges/:id/complete',    completeChallenge);
router.delete('/challenges/:id/leave',      leaveChallenge);
router.get('/offset-projects', authorize('ADMIN'), getOffsetProjects);

/* AI features */
router.post('/report', authorize('ADMIN'),  generateReport);
router.post('/goals',                       getSuggestedGoals);
router.post('/challenge-suggestion',        suggestChallenge);
router.get('/awards',                       getAwards);             // points, tiers, badges

/* ML Forecasting endpoints */
router.get('/forecast',                     getForecast);                    // User forecast
router.get('/compare-models', authorize('ADMIN'), compareModels);            // Compare all 3 models
router.get('/ml-health',                    checkMLServiceHealth);           // ML service status

module.exports = router;
