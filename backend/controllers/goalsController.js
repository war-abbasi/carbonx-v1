const { prisma } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/* Current-month emissions total for a user (kg CO2e). */
async function currentMonthTotal(userId) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const agg = await prisma.carbonEntry.aggregate({
    where: { userId, entryDate: { gte: start } },
    _sum:  { valueKg: true },
  });
  return parseFloat((agg._sum.valueKg ?? 0).toFixed(2));
}

/* Attach live progress to a goal row. */
function withProgress(goal, monthKg) {
  const target  = goal.targetKg || 0;
  const pct     = target > 0 ? Math.round((monthKg / target) * 100) : 0;
  const onTrack = monthKg <= target;
  return {
    ...goal,
    currentKg: monthKg,
    progressPct: pct,
    onTrack,
    remainingKg: parseFloat((target - monthKg).toFixed(2)),
  };
}

/* GET /api/goals */
async function listGoals(req, res, next) {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    const monthKg = await currentMonthTotal(req.user.id);
    return successResponse(res, {
      goals: goals.map((g) => withProgress(g, monthKg)),
      currentMonthKg: monthKg,
    }, 'Goals fetched.');
  } catch (err) { next(err); }
}

/* POST /api/goals  { title, targetKg, period? } */
async function createGoal(req, res, next) {
  try {
    const { title, targetKg, period } = req.body;
    if (!title || targetKg == null) {
      return errorResponse(res, 'title and targetKg are required.', 400);
    }
    const target = parseFloat(targetKg);
    if (isNaN(target) || target <= 0) {
      return errorResponse(res, 'targetKg must be a positive number.', 400);
    }
    const goal = await prisma.goal.create({
      data: {
        userId:   req.user.id,
        title:    String(title).slice(0, 150),
        targetKg: target,
        period:   ['monthly', 'quarterly', 'yearly'].includes(period) ? period : 'monthly',
      },
    });
    const monthKg = await currentMonthTotal(req.user.id);
    return successResponse(res, withProgress(goal, monthKg), 'Goal created.', 201);
  } catch (err) { next(err); }
}

/* PATCH /api/goals/:id  { title?, targetKg?, status? } */
async function updateGoal(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Goal not found.', 404);

    const data = {};
    if (req.body.title != null)    data.title    = String(req.body.title).slice(0, 150);
    if (req.body.targetKg != null) {
      const t = parseFloat(req.body.targetKg);
      if (isNaN(t) || t <= 0) return errorResponse(res, 'targetKg must be a positive number.', 400);
      data.targetKg = t;
    }
    if (['active', 'achieved', 'archived'].includes(req.body.status)) data.status = req.body.status;

    const goal = await prisma.goal.update({ where: { id }, data });
    const monthKg = await currentMonthTotal(req.user.id);
    return successResponse(res, withProgress(goal, monthKg), 'Goal updated.');
  } catch (err) { next(err); }
}

/* DELETE /api/goals/:id */
async function deleteGoal(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return errorResponse(res, 'Goal not found.', 404);
    await prisma.goal.delete({ where: { id } });
    return successResponse(res, { id }, 'Goal deleted.');
  } catch (err) { next(err); }
}

module.exports = { listGoals, createGoal, updateGoal, deleteGoal };
