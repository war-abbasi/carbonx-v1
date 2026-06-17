const {
  createEntry, updateEntry, deleteEntry, bulkCreateEntries, getUserEntries, getLeaderboard,
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

/* PATCH /api/carbon/entries/:id */
async function editEntry(req, res, next) {
  try {
    const entryId = parseInt(req.params.id);
    if (isNaN(entryId)) return errorResponse(res, 'Invalid entry id.', 400);
    const { category, subCategory, quantity, description, entryDate } = req.body;
    const entry = await updateEntry({
      userId: req.user.id, entryId, category, subCategory, quantity, description, entryDate,
    });
    return successResponse(res, entry, 'Entry updated.');
  } catch (err) { next(err); }
}

/* DELETE /api/carbon/entries/:id */
async function removeEntry(req, res, next) {
  try {
    const entryId = parseInt(req.params.id);
    if (isNaN(entryId)) return errorResponse(res, 'Invalid entry id.', 400);
    const result = await deleteEntry({ userId: req.user.id, entryId });
    return successResponse(res, result, 'Entry deleted.');
  } catch (err) { next(err); }
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

/* POST /api/carbon/bulk-upload  (admin only — parsed CSV rows as JSON) */
async function bulkUpload(req, res, next) {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return errorResponse(res, 'entries array is required.', 400);
    }
    if (entries.length > 1000) {
      return errorResponse(res, 'Maximum 1 000 rows per upload.', 400);
    }
    const result = await bulkCreateEntries(req.user.id, entries);
    return successResponse(res, result, `${result.inserted} entries imported successfully.`);
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

module.exports = { submitEntry, editEntry, removeEntry, bulkUpload, getMyEntries, getSummary, leaderboard, analytics, forecast, getFactors };
