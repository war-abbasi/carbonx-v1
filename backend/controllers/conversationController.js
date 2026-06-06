const { prisma }                        = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/* GET /api/conversations — list current user's conversations */
async function list(req, res, next) {
  try {
    const conversations = await prisma.conversation.findMany({
      where:   { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, createdAt: true, updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return successResponse(res, conversations, 'Conversations fetched.');
  } catch (err) { next(err); }
}

/* GET /api/conversations/:id — load messages for one conversation */
async function getOne(req, res, next) {
  try {
    const conv = await prisma.conversation.findFirst({
      where:   { id: parseInt(req.params.id), userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) return errorResponse(res, 'Conversation not found.', 404);
    return successResponse(res, conv, 'Conversation loaded.');
  } catch (err) { next(err); }
}

/* POST /api/conversations — create empty conversation */
async function create(req, res, next) {
  try {
    const conv = await prisma.conversation.create({
      data: { userId: req.user.id, title: 'New Chat' },
    });
    return successResponse(res, conv, 'Conversation created.', 201);
  } catch (err) { next(err); }
}

/* PATCH /api/conversations/:id — rename */
async function rename(req, res, next) {
  try {
    const { title } = req.body;
    if (!title?.trim()) return errorResponse(res, 'title is required.', 400);
    const conv = await prisma.conversation.updateMany({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      data:  { title: title.trim().slice(0, 80) },
    });
    if (!conv.count) return errorResponse(res, 'Conversation not found.', 404);
    return successResponse(res, null, 'Renamed.');
  } catch (err) { next(err); }
}

/* DELETE /api/conversations/:id */
async function remove(req, res, next) {
  try {
    const del = await prisma.conversation.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!del.count) return errorResponse(res, 'Conversation not found.', 404);
    return successResponse(res, null, 'Deleted.');
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, rename, remove };
