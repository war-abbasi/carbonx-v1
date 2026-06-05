const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  submitEntry, getMyEntries, getSummary,
  leaderboard, getFactors,
} = require('../controllers/carbonController');

const router = Router();

// All carbon routes require authentication
router.use(authenticate);

router.get('/factors',     getFactors);    // emission factor catalogue
router.post('/entries',    submitEntry);   // log a new entry
router.get('/entries',     getMyEntries);  // own entries
router.get('/summary',     getSummary);    // own totals by category/scope
router.get('/leaderboard', leaderboard);   // ranked list of all users

module.exports = router;
