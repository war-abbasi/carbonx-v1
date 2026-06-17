const { Router } = require('express');
const authRoutes   = require('./authRoutes');
const carbonRoutes = require('./carbonRoutes');
const adminRoutes  = require('./adminRoutes');
const chatRoutes          = require('./chatRoutes');
const conversationRoutes  = require('./conversationRoutes');
const insightsRoutes      = require('./insightsRoutes');
const goalsRoutes         = require('./goalsRoutes');

const router = Router();

router.use('/auth',   authRoutes);
router.use('/carbon', carbonRoutes);
router.use('/admin',  adminRoutes);
router.use('/chat',          chatRoutes);
router.use('/conversations', conversationRoutes);
router.use('/insights',      insightsRoutes);
router.use('/goals',         goalsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'CarbonX API is running.', timestamp: new Date().toISOString() });
});

module.exports = router;
