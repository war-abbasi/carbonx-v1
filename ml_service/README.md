# CarbonX ML Microservice

Production-grade machine learning forecasting engine for carbon emissions prediction.

## Features

- **Prophet Forecasting** — Facebook's time-series model with automatic trend and seasonality detection
- **XGBoost Forecasting** — Gradient boosting with feature engineering
- **Holt-Winters Forecasting** — Exponential smoothing with configurable smoothing parameters
- **Model Comparison** — Automatic evaluation (RMSE, MAE, MAPE, R²) and best model selection
- **Emissions Calculation** — Convert activity data (electricity, fuel, travel, waste) to kg CO₂e
- **Feature Engineering** — Lag features, rolling averages, seasonal indicators, trend detection
- **Confidence Intervals** — 90% confidence bands on all forecasts
- **Scope 1/2/3 Tracking** — Classify emissions by GHG protocol scope

## Installation

### Requirements
- Python 3.11+
- PostgreSQL (optional, for production)
- 4GB+ RAM (for Prophet/XGBoost training)

### Setup

```bash
# Clone and navigate
cd ml_service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration
```

## Running Locally

```bash
# Run Flask dev server
python app.py

# Server starts on http://localhost:5001
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Generate Forecast (Compare all 3 models)
```bash
POST /api/v1/forecast/generate

Request:
{
  "organization_id": "org_123",
  "historical_data": [150, 160, 175, 190, ...],  # 36+ months recommended
  "months_ahead": 12,
  "features": {
    "employee_counts": [100, 105, 110, ...],
    "start_date": "2023-01-01"
  }
}

Response:
{
  "organization_id": "org_123",
  "timestamp": "2026-01-15T10:30:00Z",
  "models": {
    "prophet": { "metrics": {...}, "forecast": [...] },
    "xgboost": { "metrics": {...}, "forecast": [...] },
    "holt_winters": { "metrics": {...}, "forecast": [...] }
  },
  "best_model": "prophet",
  "best_score": 8.5
}
```

### Calculate Emissions
```bash
POST /api/v1/emissions/calculate

Request:
{
  "organization_id": "org_123",
  "month": "2026-01",
  "activities": {
    "electricity_kwh": 50000,
    "diesel_liters": 1000,
    "travel_km": 5000,
    "waste_kg": 500
  }
}

Response:
{
  "organization_id": "org_123",
  "month": "2026-01",
  "scope1": 2680,      # Direct emissions (diesel)
  "scope2": 22500,     # Indirect (electricity)
  "scope3": 1960,      # Value chain (travel + waste)
  "total_co2e": 27140,
  "breakdown": {...}
}
```

### Get Model Comparison (FYP Defense Table)
```bash
GET /api/v1/models/comparison

Response:
{
  "timestamp": "2026-01-15T10:30:00Z",
  "models": [
    {
      "model": "Prophet",
      "rmse": 8.5,
      "mae": 6.2,
      "mape": 3.1,
      "r2": 0.92,
      "training_time_seconds": 2.3
    },
    {
      "model": "XGBoost",
      "rmse": 9.2,
      "mae": 6.8,
      "mape": 3.5,
      "r2": 0.90,
      "training_time_seconds": 1.8
    },
    {
      "model": "Holt-Winters",
      "rmse": 11.3,
      "mae": 8.1,
      "mape": 4.2,
      "r2": 0.87,
      "training_time_seconds": 0.1
    }
  ],
  "best_model": "prophet"
}
```

## Docker Deployment

```bash
# Build image
docker build -t carbonx-ml:latest .

# Run container
docker run -p 5001:5001 \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/carbonx" \
  -e ML_SERVICE_PORT=5001 \
  carbonx-ml:latest

# With docker-compose (if added)
docker-compose up -d
```

## Integration with Node Backend

The ML service is a standalone microservice. The Node.js backend (port 5000) calls it:

```javascript
// From Node backend
const response = await fetch('http://ml-service:5001/api/v1/forecast/generate', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: orgId,
    historical_data: [...],
    months_ahead: 12
  })
});
```

## Model Architecture

### Prophet
- Handles trend, seasonality, holidays automatically
- Good for data with strong seasonal patterns (summer AC peaks)
- Training time: ~2s

### XGBoost
- Uses engineered features (lag, rolling avg, trend, etc.)
- Better with feature-rich datasets
- Training time: ~2s

### Holt-Winters
- Lightweight, fast, interpretable
- Good baseline for comparison
- Training time: ~0.1s
- Parameters: alpha=0.3, beta=0.1, gamma=0.1 (tunable)

## Testing

```bash
# Run with test data
python -c "
from services.model_comparison import ModelComparison
import numpy as np

# Generate test data (36 months with seasonality)
historical = []
for month in range(36):
    base = 200 + (month * 2)  # Upward trend
    seasonal = 50 * np.sin(month * 2 * np.pi / 12)  # Seasonal variation
    historical.append(base + seasonal)

mc = ModelComparison()
result = mc.compare_models('test_org', historical, forecast_horizon=12)
print('Best model:', result['best_model'])
print('Summary:', result['summary'])
"
```

## Feature Engineering Details

The ML service automatically engineers these features from historical data:

| Feature | Purpose |
|---------|---------|
| `lag_1`, `lag_3`, `lag_6`, `lag_12` | Previous months' emissions |
| `rolling_mean_3`, `rolling_mean_6`, `rolling_mean_12` | Smoothed trends |
| `rolling_std_3`, `rolling_std_6` | Volatility detection |
| `month`, `quarter` | Seasonal indicators |
| `is_summer`, `is_winter` | Peak period markers |
| `trend` | Linear time component |
| `employee_count` | Organizational size |
| `emissions_per_employee` | Efficiency metric |
| `yoy_change` | Year-over-year growth |

## Confidence Intervals

All forecasts include 90% confidence bands:

```
predicted_emissions: 245.6 kg
lower_bound: 232.1 kg  (90% confident >= this)
upper_bound: 259.1 kg  (90% confident <= this)
```

## Configuration

Edit `.env` to customize:

```env
# Models
PROPHET_SEASONALITY_MODE=additive  # or multiplicative
XGBOOST_MAX_DEPTH=5
XGBOOST_LEARNING_RATE=0.1
HOLT_WINTERS_ALPHA=0.3
HOLT_WINTERS_BETA=0.1
HOLT_WINTERS_GAMMA=0.1

# API
ML_SERVICE_PORT=5001
FLASK_DEBUG=False
```

## Performance Notes

- **Minimum data:** 2 months (but results better with 12+)
- **Ideal data:** 36+ months (3 years) for seasonal pattern detection
- **Training time:** ~5s for all 3 models combined on 36 months of data
- **Forecast horizon:** 1–24 months supported (12 recommended)
- **Memory:** ~500MB for typical workload

## TODO / Future Work

- [ ] Async job queue (Celery/RQ) for background training
- [ ] Model persistence (save trained models to disk/DB)
- [ ] Database integration (PostgreSQL)
- [ ] Distributed training for large datasets
- [ ] Model auto-tuning (hyperparameter optimization)
- [ ] Anomaly detection (flag unusual data points)
- [ ] Holiday calendar support (Eid, Iftaar, etc. in Pakistan)
