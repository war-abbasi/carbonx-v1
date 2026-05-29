const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return errorResponse(res, formatted[0].message, 422, formatted);
  }
  next();
}

module.exports = validateRequest;
