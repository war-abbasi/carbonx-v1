const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = Router();

const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/me', authenticate, getMe);

module.exports = router;
