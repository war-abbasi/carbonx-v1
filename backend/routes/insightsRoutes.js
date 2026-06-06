const { Router }       = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getRecommendations,
  listChallenges, joinChallenge, completeChallenge, leaveChallenge,
  getOffsetProjects,
  generateReport, getSuggestedGoals, suggestChallenge,
} = require('../controllers/insightsController');

const router = Router();
router.use(authenticate);

router.get('/recommendations',              getRecommendations);
router.get('/challenges',                   listChallenges);
router.post('/challenges/:id/join',         joinChallenge);
router.patch('/challenges/:id/complete',    completeChallenge);
router.delete('/challenges/:id/leave',      leaveChallenge);
router.get('/offset-projects', authorize('ADMIN'), getOffsetProjects);

/* New AI features */
router.post('/report', authorize('ADMIN'),  generateReport);
router.post('/goals',                       getSuggestedGoals);
router.post('/challenge-suggestion',        suggestChallenge);

module.exports = router;
