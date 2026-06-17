const { registerUser, loginUser, updateProfile, changePassword } = require('../services/authService');
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

async function updateMe(req, res, next) {
  try {
    const { name, email } = req.body;
    const user = await updateProfile({ userId: req.user.id, name, email });
    return successResponse(res, user, 'Profile updated.');
  } catch (err) { next(err); }
}

async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await changePassword({ userId: req.user.id, currentPassword, newPassword });
    return successResponse(res, { updated: true }, 'Password changed.');
  } catch (err) { next(err); }
}

module.exports = { register, login, getMe, updateMe, updatePassword };
