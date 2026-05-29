const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const { prisma } = require('../config/db');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return errorResponse(res, 'User not found. Token invalid.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid token.', 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'You do not have permission to perform this action.', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
