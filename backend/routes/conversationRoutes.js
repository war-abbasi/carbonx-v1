const { Router }       = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  list, getOne, create, rename, remove,
} = require('../controllers/conversationController');

const router = Router();
router.use(authenticate);

router.get('/',        list);
router.post('/',       create);
router.get('/:id',     getOne);
router.patch('/:id',   rename);
router.delete('/:id',  remove);

module.exports = router;
