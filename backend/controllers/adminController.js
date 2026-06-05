const { prisma } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/* GET /api/admin/users — list all users with their carbon totals */
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count:        { select: { carbonEntries: true } },
        carbonEntries: { select: { valueKg: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = users.map((u) => ({
      id:           u.id,
      name:         u.name,
      email:        u.email,
      role:         u.role,
      createdAt:    u.createdAt,
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

    await prisma.user.delete({ where: { id: targetId } });
    return successResponse(res, null, 'User deleted.');
  } catch (err) {
    if (err.code === 'P2025') return errorResponse(res, 'User not found.', 404);
    next(err);
  }
}

module.exports = { listUsers, updateRole, deleteUser };
