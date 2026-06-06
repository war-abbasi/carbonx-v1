const {
  createEntry, getUserEntries, getLeaderboard,
  getUserSummary, getAnalytics, getForecast, FACTORS,
} = require('../services/carbonService');
const { successResponse, errorResponse } = require('../utils/response');

/* POST /api/carbon/entries */
async function submitEntry(req, res, next) {
  try {
    const { category, subCategory, quantity, description, entryDate } = req.body;
    if (!category || !subCategory || quantity == null) {
      return errorResponse(res, 'category, subCategory and quantity are required.', 400);
    }
    if (isNaN(quantity) || quantity <= 0) {
      return errorResponse(res, 'quantity must be a positive number.', 400);
    }
    const entry = await createEntry({
      userId: req.user.id,
      category,
      subCategory,
      quantity: parseFloat(quantity),
      description,
      entryDate,
    });
    return successResponse(res, entry, 'Carbon entry recorded.', 201);
  } catch (err) {
    next(err);
  }
}

/* GET /api/carbon/entries */
async function getMyEntries(req, res, next) {
  try {
    const limit  = parseInt(req.query.limit) || 20;
    const result = await getUserEntries(req.user.id, limit);
    return successResponse(res, result, 'Entries fetched.');
  } catch (err) {
    next(err);
  }
}

/* GET /api/carbon/summary */
async function getSummary(req, res, next) {
  try {
    const summary = await getUserSummary(req.user.id);
    return successResponse(res, summary, 'Summary fetched.');
  } catch (err) {
    next(err);
  }
}

/* GET /api/carbon/leaderboard?period=all|week|month */
async function leaderboard(req, res, next) {
  try {
    const period = ['all', 'week', 'month'].includes(req.query.period)
      ? req.query.period
      : 'all';
    const data = await getLeaderboard(period);
    return successResponse(res, data, 'Leaderboard fetched.');
  } catch (err) {
    next(err);
  }
}

/* GET /api/carbon/analytics?period=year|6months|3months */
async function analytics(req, res, next) {
  try {
    const period  = ['year', '6months', '30days', '7days'].includes(req.query.period)
      ? req.query.period : 'year';
    const isAdmin = req.user.role === 'ADMIN';
    const data    = await getAnalytics(req.user.id, isAdmin, period);
    return successResponse(res, data, 'Analytics fetched.');
  } catch (err) {
    next(err);
  }
}

/* GET /api/carbon/forecast?months=6 */
async function forecast(req, res, next) {
  try {
    const months  = Math.min(12, Math.max(1, parseInt(req.query.months) || 6));
    const isAdmin = req.user.role === 'ADMIN';
    const data    = await getForecast(req.user.id, isAdmin, months);
    return successResponse(res, data, 'Forecast generated.');
  } catch (err) {
    next(err);
  }
}

/* GET /api/carbon/factors — return emission factor catalogue */
async function getFactors(req, res) {
  return successResponse(res, FACTORS, 'Emission factors fetched.');
}

module.exports = { submitEntry, getMyEntries, getSummary, leaderboard, analytics, forecast, getFactors };
