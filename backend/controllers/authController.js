const { registerUser, loginUser } = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });
    return successResponse(res, result, 'Account created successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    return successResponse(res, result, 'Login successful.');
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  return successResponse(res, req.user, 'User fetched successfully.');
}

module.exports = { register, login, getMe };
