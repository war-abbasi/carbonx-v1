const { Router }       = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  listGoals, createGoal, updateGoal, deleteGoal,
} = require('../controllers/goalsController');

const router = Router();
router.use(authenticate);

router.get('/',        listGoals);
router.post('/',       createGoal);
router.patch('/:id',   updateGoal);
router.delete('/:id',  deleteGoal);

module.exports = router;
