const { Router } = require('express');
const authRoutes = require('./authRoutes');

const router = Router();

router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'CarbonX API is running.', timestamp: new Date().toISOString() });
});

module.exports = router;
