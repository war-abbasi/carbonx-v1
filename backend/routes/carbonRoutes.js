const { Router }                    = require('express');
const { authenticate, authorize }   = require('../middleware/authMiddleware');
const {
  submitEntry, editEntry, removeEntry, bulkUpload, getMyEntries, getSummary,
  leaderboard, analytics, forecast, getFactors,
} = require('../controllers/carbonController');

const router = Router();

// All carbon routes require authentication
router.use(authenticate);

router.get('/factors',                         getFactors);   // emission factor catalogue
router.post('/entries',                        submitEntry);  // log a new entry
router.get('/entries',                         getMyEntries); // own entries
router.patch('/entries/:id',                   editEntry);    // edit own entry
router.delete('/entries/:id',                  removeEntry);  // delete own entry
router.get('/summary',                         getSummary);   // own totals by category/scope
router.get('/leaderboard',                     leaderboard);  // ranked list
router.get('/analytics',                       analytics);    // analytics + kpis
router.get('/forecast',                        forecast);     // linear regression forecast
router.post('/bulk-upload', authorize('ADMIN'), bulkUpload);  // admin CSV import

module.exports = router;
