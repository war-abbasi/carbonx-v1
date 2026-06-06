# CarbonX ML Service Integration Guide

This document explains how to integrate the Python ML microservice with the existing Node.js backend.

## Architecture Overview

```
┌─────────────────────┐
│   React Frontend    │
│   (Port 3000)       │
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐         ┌──────────────────┐
│  Node.js Backend    │◄───────►│  Python ML Service│
│  (Port 5000)        │         │  (Port 5001)      │
└──────────┬──────────┘         └──────────────────┘
           │
           ▼
┌──────────────────────┐
│  PostgreSQL Database │
│  (Port 5432)         │
└──────────────────────┘
```

## Setup

### 1. Backend Setup

The Node.js backend should call the ML service for forecasting requests.

#### Environment Variables

Add to your `.env` (backend):

```env
# ML Service URL
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=30000
```

#### API Client

Create `backend/api/mlServiceClient.js`:

```javascript
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class MLServiceClient {
  async generateForecast(organizationId, historicalData, options = {}) {
    try {
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
        { timeout: process.env.ML_SERVICE_TIMEOUT || 30000 }
      );

      return response.data;
    } catch (error) {
      console.error('ML Service forecast error:', error.message);
      throw new Error(`Forecast failed: ${error.message}`);
    }
  }

  async calculateEmissions(organizationId, activities, month) {
    try {
      const payload = {
        organization_id: organizationId,
        month,
        activities
      };

      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/emissions/calculate`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('ML Service emissions calculation error:', error.message);
      throw error;
    }
  }

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
        { timeout: process.env.ML_SERVICE_TIMEOUT || 30000 }
      );

      return response.data;
    } catch (error) {
      console.error('ML Service model comparison error:', error.message);
      throw error;
    }
  }

  async getModelComparison() {
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/api/v1/models/comparison`
      );

      return response.data;
    } catch (error) {
      console.error('ML Service model comparison error:', error.message);
      throw error;
    }
  }

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

### 2. Backend Controller Integration

Update `backend/controllers/insightsController.js`:

```javascript
const mlService = require('../api/mlServiceClient');

// ... existing imports ...

// Update the forecast endpoint
exports.getForecast = async (req, res) => {
  try {
    const { userId } = req.user;
    const { months = 12 } = req.query;

    // Get user's carbon entries
    const entries = await CarbonEntry.findAll({
      where: { userId },
      attributes: ['entryDate', 'valueKg'],
      order: [['entryDate', 'ASC']]
    });

    if (entries.length < 2) {
      return res.status(400).json({
        error: 'Insufficient data for forecasting. Need at least 2 months of data.'
      });
    }

    // Group by month
    const monthlyData = {};
    entries.forEach(entry => {
      const month = entry.entryDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += entry.valueKg;
    });

    const historicalData = Object.values(monthlyData).sort();

    // Get employee counts (if admin)
    let employeeCounts = [];
    if (req.user.role === 'ADMIN') {
      // Get org-wide employee data
      employeeCounts = await User.findAll({
        attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'count']]
      });
    }

    // Call ML service
    const mlResult = await mlService.generateForecast(
      `org_${userId}`, // Use userId as org identifier
      historicalData,
      {
        months,
        employeeCounts,
        startDate: new Date(Math.min(...entries.map(e => e.entryDate)))
      }
    );

    return res.json({
      success: true,
      forecast: mlResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Forecast error:', error);
    return res.status(500).json({
      error: 'Failed to generate forecast',
      details: error.message
    });
  }
};

// NEW: Model comparison endpoint
exports.compareModels = async (req, res) => {
  try {
    const { userId } = req.user;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Only admins can compare models'
      });
    }

    // Get org-wide data
    const entries = await CarbonEntry.findAll({
      attributes: ['entryDate', 'valueKg'],
      order: [['entryDate', 'ASC']]
    });

    if (entries.length < 12) {
      return res.status(400).json({
        error: 'Need at least 12 months of data for model comparison'
      });
    }

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
    const mlResult = await mlService.compareModels(
      `org_admin_${userId}`,
      historicalData,
      { horizon: 12 }
    );

    return res.json({
      success: true,
      comparison: mlResult,
      models: await mlService.getModelComparison(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Model comparison error:', error);
    return res.status(500).json({
      error: 'Failed to compare models',
      details: error.message
    });
  }
};

// NEW: ML Service health check
exports.mlServiceHealth = async (req, res) => {
  try {
    const health = await mlService.healthCheck();

    return res.json({
      status: health.status === 'available' ? 'up' : 'down',
      details: health
    });

  } catch (error) {
    return res.status(503).json({
      status: 'down',
      error: 'ML Service unavailable'
    });
  }
};
```

### 3. API Routes

Update `backend/routes/insightsRoutes.js`:

```javascript
router.get('/forecast', authMiddleware, insightsController.getForecast);
router.get('/compare-models', authMiddleware, insightsController.compareModels);
router.get('/ml-health', insightsController.mlServiceHealth);
```

### 4. Frontend Integration

Update `frontend/src/api/insightsApi.js`:

```javascript
export const getForecast = async (months = 12) => {
  const response = await api.get('/insights/forecast', {
    params: { months }
  });
  return response.data;
};

export const compareModels = async () => {
  const response = await api.get('/insights/compare-models');
  return response.data;
};

export const checkMLServiceHealth = async () => {
  try {
    const response = await api.get('/insights/ml-health');
    return response.data;
  } catch (error) {
    return { status: 'down', error: error.message };
  }
};
```

## Running Together

### Option 1: Local Development (Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - ML Service:**
```bash
cd ml_service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
# Runs on http://localhost:5001
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Option 2: Docker Compose (All-in-One)

```bash
# From project root
docker-compose up

# Services will start:
# - Backend: http://localhost:5000
# - ML Service: http://localhost:5001
# - Frontend: http://localhost:3000
# - PostgreSQL: localhost:5432
```

### Option 3: Production Deployment

**Railway.app** (Current setup)

1. **Backend:** Deploy as-is (existing Node.js service)

2. **ML Service:** Create new service
   ```bash
   # New Railway service (Python)
   - Build command: pip install -r requirements.txt
   - Start command: python app.py
   - Environment: Set ML_SERVICE_PORT to Railway's $PORT
   ```

3. **Network:** Set backend's ML_SERVICE_URL to ML service's URL
   ```
   ML_SERVICE_URL=https://carbonx-ml-service.railway.app
   ```

## Error Handling

The ML service may be temporarily unavailable. Handle gracefully:

```javascript
// In Node backend
const getForecastWithFallback = async (req, res) => {
  try {
    const forecast = await mlService.generateForecast(...);
    return res.json(forecast);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
      // ML service down - return previous forecast or placeholder
      logger.warn('ML Service unavailable, returning cached forecast');
      
      return res.json({
        forecast: cachedForecast || defaultForecast(),
        warning: 'Using cached data. ML Service temporarily unavailable.'
      });
    }
    
    throw error;
  }
};
```

## Monitoring

### Health Checks

Add periodic health checks:

```javascript
// In backend startup
const checkMLServiceHealth = async () => {
  const health = await mlService.healthCheck();
  if (health.status !== 'available') {
    console.warn('ML Service is not responding');
    // Alert ops, fall back to rule-based recommendations
  }
};

setInterval(checkMLServiceHealth, 60000); // Every minute
```

### Logging

Both services log to console. For production:

- **Backend:** Configure Winston/Bunyan logging
- **ML Service:** Logs to `logs/` directory (via Flask)

## Testing Integration

```bash
# 1. Start both services
npm run dev  # Backend
python app.py  # ML Service (in separate terminal)

# 2. Test ML Service directly
curl http://localhost:5001/health

# 3. Test via Backend
curl http://localhost:5000/api/insights/ml-health

# 4. Test forecast endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/insights/forecast?months=12
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot connect to ML Service` | Check if `python app.py` is running and `ML_SERVICE_URL` is correct |
| `ML Service timeout` | Increase `ML_SERVICE_TIMEOUT` in backend `.env` |
| `Module not found` | Run `pip install -r requirements.txt` in ml_service |
| `Out of memory` | Reduce forecast horizon or historical data size |
| `Model training fails` | Check data quality (need 36+ months for Prophet) |

## Next Steps

1. ✅ Run `python test_models.py` to validate ML service
2. ✅ Update backend with ML service client
3. ✅ Test integration locally with `docker-compose`
4. ✅ Deploy to Railway (create separate Python service for ML)
5. ✅ Add monitoring and alerts for ML service availability
