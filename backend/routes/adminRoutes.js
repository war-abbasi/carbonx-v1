const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { listUsers, updateRole, deleteUser } = require('../controllers/adminController');

const router = Router();

// All admin routes require authentication AND ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users',           listUsers);
router.patch('/users/:id/role', updateRole);
router.delete('/users/:id',    deleteUser);

module.exports = router;
