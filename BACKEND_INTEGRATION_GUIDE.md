# Backend Integration Guide - Step by Step

**Goal:** Wire Node.js backend to call ML service and return forecasts

**Time:** ~2-3 hours

---

## 📋 Overview

```
User Request
    ↓
Node Backend (Port 5000)
    ↓
ML Service (Port 5001) ← We just validated this ✅
    ↓
Database (PostgreSQL)
    ↓
Response back to Frontend
```

---

## 🎯 Step 1: Create ML Service Client

**File:** `backend/api/mlServiceClient.js`

```javascript
const axios = require('axios');
const logger = require('../utils/logger'); // or your logging method

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class MLServiceClient {
  /**
   * Generate forecast using all 3 ML models
   */
  async generateForecast(organizationId, historicalData, options = {}) {
    try {
      logger.info(`Generating forecast for ${organizationId}`);

      const payload = {
        organization_id: organizationId,
        historical_data: historicalData,
        months_ahead: options.months || 12,
        features: {
          employee_counts: options.employeeCounts || [],
          start_date: options.startDate || '2023-01-01'
        }
      };

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/forecast/generate`,
        payload,
        { 
          timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '30000')
        }
      );

      logger.info(`Forecast generated for ${organizationId}`);
      return response.data;

    } catch (error) {
      logger.error(`ML Service forecast error: ${error.message}`);
      throw new Error(`Forecast generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate emissions from activities
   */
  async calculateEmissions(organizationId, activities, month) {
    try {
      const payload = {
        organization_id: organizationId,
        month: month, // Format: YYYY-MM
        activities: activities // {electricity_kwh, diesel_liters, travel_km, waste_kg}
      };

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/emissions/calculate`,
        payload
      );

      return response.data;

    } catch (error) {
      logger.error(`Emissions calculation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare all 3 models
   */
  async compareModels(organizationId, historicalData, options = {}) {
    try {
      const payload = {
        organization_id: organizationId,
        historical_data: historicalData,
        forecast_horizon: options.horizon || 12,
        features: {
          employee_counts: options.employeeCounts || [],
          start_date: options.startDate || '2023-01-01'
        }
      };

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/forecast/generate`,
        payload,
        { 
          timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '30000')
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Model comparison error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get model comparison metrics
   */
  async getModelComparison() {
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/api/v1/models/comparison`
      );

      return response.data;

    } catch (error) {
      logger.error(`Get model comparison error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/health`,
        { timeout: 5000 }
      );

      return response.data;

    } catch (error) {
      return {
        status: 'unavailable',
        error: error.message
      };
    }
  }
}

module.exports = new MLServiceClient();
```

---

## 🎯 Step 2: Update Controller

**File:** `backend/controllers/insightsController.js`

Add these methods:

```javascript
const mlService = require('../api/mlServiceClient');
const logger = require('../utils/logger');

// ... existing imports and code ...

/**
 * Generate forecast for user
 * GET /api/insights/forecast?months=12
 */
exports.getForecast = async (req, res) => {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months) || 12;

    // Get user's carbon entries from database
    const entries = await CarbonEntry.findAll({
      where: { userId },
      attributes: ['entryDate', 'valueKg'],
      order: [['entryDate', 'ASC']]
    });

    // Check minimum data requirement
    if (entries.length < 2) {
      return res.status(400).json({
        error: 'Insufficient data. Need at least 2 months of historical data.',
        dataPoints: entries.length
      });
    }

    // Group by month and sum
    const monthlyData = {};
    entries.forEach(entry => {
      const month = entry.entryDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += entry.valueKg;
    });

    const historicalData = Object.values(monthlyData).sort();
    const sortedMonths = Object.keys(monthlyData).sort();

    // Get employee counts (if available)
    let employeeCounts = [];
    const userWithOrg = await User.findByPk(userId, {
      include: ['Organization']
    });

    if (userWithOrg && userWithOrg.Organization) {
      // Fetch organization employee history
      const empHistory = await EmployeeHistory.findAll({
        where: { organizationId: userWithOrg.Organization.id },
        order: [['month', 'ASC']]
      });
      employeeCounts = empHistory.map(e => e.count);
    }

    // Call ML service
    const forecast = await mlService.generateForecast(
      `org_${userId}`,
      historicalData,
      {
        months: months,
        employeeCounts: employeeCounts,
        startDate: sortedMonths[0]
      }
    );

    // Store forecast in database (optional)
    await Forecast.create({
      userId,
      organizationId: userWithOrg?.organizationId,
      bestModel: forecast.best_model,
      data: forecast,
      createdAt: new Date()
    });

    return res.json({
      success: true,
      forecast: forecast,
      dataPoints: historicalData.length,
      months: months,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Forecast error: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to generate forecast',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Compare all 3 models
 * GET /api/insights/compare-models
 * Admin only
 */
exports.compareModels = async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Only admins can compare models'
      });
    }

    // Get all carbon entries across organization
    const entries = await CarbonEntry.findAll({
      where: { /* filter by org if needed */ },
      attributes: ['entryDate', 'valueKg'],
      order: [['entryDate', 'ASC']]
    });

    if (entries.length < 12) {
      return res.status(400).json({
        error: 'Need at least 12 months of data for model comparison',
        dataPoints: entries.length
      });
    }

    // Group by month
    const monthlyData = {};
    entries.forEach(entry => {
      const month = entry.entryDate.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += entry.valueKg;
    });

    const historicalData = Object.values(monthlyData).sort();

    // Call ML service
    const comparison = await mlService.compareModels(
      `org_admin_${req.user.id}`,
      historicalData,
      { horizon: 12 }
    );

    // Get metrics table
    const metrics = await mlService.getModelComparison();

    return res.json({
      success: true,
      comparison: comparison,
      metrics: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Model comparison error: ${error.message}`);
    return res.status(500).json({
      error: 'Failed to compare models',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check ML service health
 * GET /api/insights/health
 */
exports.checkMLServiceHealth = async (req, res) => {
  try {
    const health = await mlService.healthCheck();

    if (health.status === 'available') {
      return res.json({
        status: 'up',
        mlService: health,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(503).json({
        status: 'down',
        mlService: health,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    return res.status(503).json({
      status: 'down',
      error: 'ML Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
};
```

---

## 🎯 Step 3: Update Routes

**File:** `backend/routes/insightsRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { authenticate } = require('../middleware/auth');

// Get forecast
router.get('/forecast', authenticate, insightsController.getForecast);

// Compare models (admin only)
router.get('/compare-models', authenticate, insightsController.compareModels);

// ML service health check
router.get('/health', insightsController.checkMLServiceHealth);

module.exports = router;
```

---

## 🎯 Step 4: Update Environment Variables

**File:** `.env`

Add:
```env
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=30000
```

For production (Railway):
```env
ML_SERVICE_URL=https://your-ml-service.railway.app
ML_SERVICE_TIMEOUT=30000
```

---

## 🎯 Step 5: Test Integration

### Test 1: Health Check

```bash
# Start ML service in Terminal 1
cd ml_service
python app.py

# Start backend in Terminal 2
cd backend
npm run dev

# Test in Terminal 3
curl http://localhost:5000/api/insights/health
```

**Expected response:**
```json
{
  "status": "up",
  "mlService": {
    "status": "available"
  },
  "timestamp": "2026-06-07T..."
}
```

### Test 2: Get Forecast

```bash
# Create test carbon entries in database first, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/insights/forecast?months=12
```

**Expected response:**
```json
{
  "success": true,
  "forecast": {
    "organization_id": "org_...",
    "models": {
      "prophet": {...},
      "xgboost": {...},
      "holt_winters": {...}
    },
    "best_model": "xgboost"
  },
  "dataPoints": 36,
  "months": 12,
  "timestamp": "2026-06-07T..."
}
```

### Test 3: Compare Models

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/insights/compare-models
```

---

## ✅ Checklist

- [ ] Created `backend/api/mlServiceClient.js`
- [ ] Updated `backend/controllers/insightsController.js` with 3 new methods
- [ ] Updated `backend/routes/insightsRoutes.js` with 3 new routes
- [ ] Added `ML_SERVICE_URL` to `.env`
- [ ] Both services running locally
- [ ] Health check endpoint returns 200
- [ ] Forecast endpoint works with real data
- [ ] Compare models endpoint works (admin)

---

## 🚀 Next Steps After Backend Integration

1. ✅ Test both services together
2. Frontend integration (create React components)
3. Database integration (store forecasts)
4. Deploy to production (Railway)

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ML_SERVICE_URL is undefined` | Add to `.env` and restart backend |
| `Cannot connect to ML service` | Make sure `python app.py` is running on 5001 |
| `Timeout error` | Increase `ML_SERVICE_TIMEOUT` in `.env` |
| `ECONNREFUSED` | Check if ML service is running |
| `401 Unauthorized` | Make sure you're sending valid JWT token |

---

**Ready to implement? Start with Step 1! 🎯**
