const { Router }       = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getRecommendations,
  listChallenges, joinChallenge, completeChallenge, leaveChallenge,
  getOffsetProjects,
} = require('../controllers/insightsController');

const router = Router();
router.use(authenticate);

router.get('/recommendations',              getRecommendations);
router.get('/challenges',                   listChallenges);
router.post('/challenges/:id/join',         joinChallenge);
router.patch('/challenges/:id/complete',    completeChallenge);
router.delete('/challenges/:id/leave',      leaveChallenge);
router.get('/offset-projects', authorize('ADMIN'), getOffsetProjects);

module.exports = router;
