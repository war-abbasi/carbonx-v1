const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getOrganization, listUsers, createUser, updateRole, updateStatus, deleteUser, giveAward, revokeAward,
} = require('../controllers/adminController');

const router = Router();

// All admin routes require authentication AND ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/organization',        getOrganization);
router.get('/users',               listUsers);
router.post('/users',              createUser);
router.patch('/users/:id/role',    updateRole);
router.patch('/users/:id/status',  updateStatus);
router.delete('/users/:id',        deleteUser);
router.post('/users/:id/awards',   giveAward);
router.delete('/awards/:id',       revokeAward);

module.exports = router;
