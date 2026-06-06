const { Router }      = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { chat }        = require('../controllers/chatController');

const router = Router();

router.use(authenticate);
router.post('/', chat);

module.exports = router;
