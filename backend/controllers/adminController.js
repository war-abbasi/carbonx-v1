const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { getOrgAwards } = require('../services/awardsService');

/* Admins manage the users of their own organisation (or the unassigned pool if they have none) */
const orgWhere = (req) => ({ organizationId: req.user.organizationId ?? null });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

async function findOrgUser(req, id) {
  return prisma.user.findFirst({ where: { id, ...orgWhere(req) }, select: { id: true, name: true } });
}

/* GET /api/admin/organization — organisation summary */
async function getOrganization(req, res, next) {
  try {
    const [org, members, admins, suspended] = await Promise.all([
      req.user.organizationId
        ? prisma.organization.findUnique({ where: { id: req.user.organizationId } })
        : null,
      prisma.user.count({ where: orgWhere(req) }),
      prisma.user.count({ where: { ...orgWhere(req), role: 'ADMIN' } }),
      prisma.user.count({ where: { ...orgWhere(req), active: false } }),
    ]);
    return successResponse(res, { organization: org, members, admins, suspended });
  } catch (err) { next(err); }
}

/* GET /api/admin/users — list the organisation's users with carbon totals and award points */
async function listUsers(req, res, next) {
  try {
    const [users, awards] = await Promise.all([prisma.user.findMany({
      where:  orgWhere(req),
      select: {
        id: true, name: true, email: true, role: true, active: true, createdAt: true,
        organization:  { select: { name: true } },
        _count:        { select: { carbonEntries: true } },
        carbonEntries: { select: { valueKg: true } },
      },
      orderBy: { createdAt: 'asc' },
    }), getOrgAwards(req.user.organizationId)]);
    const rankMap = Object.fromEntries(awards.rankings.map((r) => [r.user.id, r]));

    const result = users.map((u) => ({
      id:           u.id,
      name:         u.name,
      email:        u.email,
      role:         u.role,
      active:       u.active,
      organization: u.organization?.name ?? null,
      createdAt:    u.createdAt,
      rank:         rankMap[u.id]?.rank ?? null,
      points:       rankMap[u.id]?.points ?? null,
      tier:         rankMap[u.id]?.tier?.name ?? null,
      badges:       rankMap[u.id]?.badges ?? [],
      entryCount:   u._count.carbonEntries,
      totalKg:      parseFloat(
        u.carbonEntries.reduce((sum, e) => sum + e.valueKg, 0).toFixed(2)
      ),
    }));

    return successResponse(res, result, 'Users fetched.');
  } catch (err) {
    next(err);
  }
}

/* PATCH /api/admin/users/:id/role — change a user's role */
async function updateRole(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return errorResponse(res, 'role must be USER or ADMIN.', 400);
    }
    if (targetId === req.user.id) {
      return errorResponse(res, 'You cannot change your own role.', 403);
    }

    if (!(await findOrgUser(req, targetId))) return errorResponse(res, 'User not found.', 404);

    const updated = await prisma.user.update({
      where:  { id: targetId },
      data:   { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return successResponse(res, updated, `User role updated to ${role}.`);
  } catch (err) {
    if (err.code === 'P2025') return errorResponse(res, 'User not found.', 404);
    next(err);
  }
}

/* DELETE /api/admin/users/:id — remove a user */
async function deleteUser(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);

    if (targetId === req.user.id) {
      return errorResponse(res, 'You cannot delete your own account.', 403);
    }

    if (!(await findOrgUser(req, targetId))) return errorResponse(res, 'User not found.', 404);

    await prisma.user.delete({ where: { id: targetId } });
    return successResponse(res, null, 'User deleted.');
  } catch (err) {
    if (err.code === 'P2025') return errorResponse(res, 'User not found.', 404);
    next(err);
  }
}

/* POST /api/admin/users — add a member to the admin's organisation */
async function createUser(req, res, next) {
  try {
    const name     = String(req.body.name ?? '').trim();
    const email    = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    const role     = req.body.role === 'ADMIN' ? 'ADMIN' : 'USER';

    if (name.length < 2)                           return errorResponse(res, 'Name must be at least 2 characters.', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse(res, 'A valid email is required.', 400);
    if (password.length < 8)                       return errorResponse(res, 'Password must be at least 8 characters.', 400);
    if (await prisma.user.findUnique({ where: { email } })) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    const user = await prisma.user.create({
      data:   { name, email, role, password: await bcrypt.hash(password, 12), organizationId: req.user.organizationId ?? null },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return successResponse(res, user, `${name} added to the organisation.`, 201);
  } catch (err) { next(err); }
}

/* PATCH /api/admin/users/:id/status — suspend or reactivate an account */
async function updateStatus(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const active   = Boolean(req.body.active);
    if (targetId === req.user.id) return errorResponse(res, 'You cannot suspend your own account.', 403);
    if (!(await findOrgUser(req, targetId))) return errorResponse(res, 'User not found.', 404);

    const updated = await prisma.user.update({
      where: { id: targetId }, data: { active },
      select: { id: true, name: true, active: true },
    });
    return successResponse(res, updated, active ? `${updated.name} reactivated.` : `${updated.name} suspended.`);
  } catch (err) { next(err); }
}

/* POST /api/admin/users/:id/awards — recognise a user (adds points to their ranking) */
async function giveAward(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const title    = String(req.body.title ?? '').trim();
    const points   = clamp(parseInt(req.body.points, 10) || 50, 0, 500);
    if (title.length < 3) return errorResponse(res, 'Award title is required.', 400);
    const target = await findOrgUser(req, targetId);
    if (!target) return errorResponse(res, 'User not found.', 404);

    const award = await prisma.award.create({
      data: {
        userId: targetId, awardedById: req.user.id, title, points,
        icon:   String(req.body.icon ?? '🏅').slice(0, 8) || '🏅',
        reason: req.body.reason ? String(req.body.reason).trim().slice(0, 200) : null,
      },
    });
    return successResponse(res, award, `Awarded "${title}" to ${target.name}.`, 201);
  } catch (err) { next(err); }
}

/* DELETE /api/admin/awards/:id — revoke an award */
async function revokeAward(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const award = await prisma.award.findUnique({ where: { id }, select: { userId: true } });
    if (!award || !(await findOrgUser(req, award.userId))) return errorResponse(res, 'Award not found.', 404);
    await prisma.award.delete({ where: { id } });
    return successResponse(res, null, 'Award revoked.');
  } catch (err) { next(err); }
}

module.exports = {
  getOrganization, listUsers, createUser, updateRole, updateStatus, deleteUser, giveAward, revokeAward,
};
