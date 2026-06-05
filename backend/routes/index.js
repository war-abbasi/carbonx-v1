const { Router } = require('express');
const authRoutes   = require('./authRoutes');
const carbonRoutes = require('./carbonRoutes');
const adminRoutes  = require('./adminRoutes');

const router = Router();

router.use('/auth',   authRoutes);
router.use('/carbon', carbonRoutes);
router.use('/admin',  adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'CarbonX API is running.', timestamp: new Date().toISOString() });
});

module.exports = router;
