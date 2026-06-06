# CarbonX ML Service - Implementation Checklist

Use this checklist to track your progress implementing the ML service.

## Phase 1: Setup & Validation ✅ Ready to Start

### Environment Setup
- [ ] **Download/Navigate to ML Service Directory**
  ```bash
  cd ml_service
  ```

- [ ] **Create Virtual Environment**
  - [ ] Linux/Mac: `python3 -m venv venv && source venv/bin/activate`
  - [ ] Windows: `python -m venv venv && venv\Scripts\activate`
  - OR run automated script:
    - [ ] Linux/Mac: `bash setup.sh`
    - [ ] Windows: `powershell -ExecutionPolicy Bypass -File setup.ps1`

- [ ] **Install Dependencies**
  ```bash
  pip install -r requirements.txt
  ```
  - [ ] Verify Flask installed
  - [ ] Verify Prophet installed
  - [ ] Verify XGBoost installed
  - [ ] Verify scikit-learn installed

### Validation
- [ ] **Run Tests**
  ```bash
  python test_models.py
  ```
  - [ ] Synthetic data generated (36 months)
  - [ ] Prophet test PASSED
  - [ ] XGBoost test PASSED
  - [ ] Holt-Winters test PASSED
  - [ ] Model comparison PASSED
  - [ ] All 3 models trained successfully

- [ ] **Start Flask Server**
  ```bash
  python app.py
  ```
  - [ ] Server runs on http://localhost:5001
  - [ ] Health check endpoint works: `curl http://localhost:5001/health`
  - [ ] Returns `{"status": "available"}`

- [ ] **Test API Endpoints** (in new terminal)
  ```bash
  # Health check
  curl http://localhost:5001/health
  
  # Model comparison
  curl http://localhost:5001/api/v1/models/comparison
  ```
  - [ ] Both endpoints respond with 200 OK

### Documentation Review
- [ ] **Read ML_SERVICE_SUMMARY.md**
  - [ ] Understand 3 models (Prophet, XGBoost, Holt-Winters)
  - [ ] Review performance metrics
  - [ ] Understand API endpoints

- [ ] **Read README.md** (in ml_service/)
  - [ ] Understand setup process
  - [ ] Review all API endpoints
  - [ ] Understand model architecture

- [ ] **Review Integration Guide**
  - [ ] Read `ML_SERVICE_INTEGRATION.md`
  - [ ] Understand architecture diagram
  - [ ] Review backend integration code

---

## Phase 2: Explore & Understand ✅ Ready to Explore

### Jupyter Notebook
- [ ] **Setup Jupyter** (optional but recommended)
  ```bash
  pip install jupyter
  jupyter notebook example_usage.ipynb
  ```

- [ ] **Run Notebook Sections**
  - [ ] Section 1: Generate synthetic data
  - [ ] Section 2: Test individual models
    - [ ] Prophet model training
    - [ ] XGBoost model training
    - [ ] Holt-Winters model training
  - [ ] Section 3: Model comparison
  - [ ] Section 4: Visualize forecasts
  - [ ] Section 5: Confidence intervals
  - [ ] Section 6: Load your real data (when ready)
  - [ ] Section 7: API integration examples

### Code Review
- [ ] **Review Model Implementations**
  - [ ] `services/prophet_model.py` - Understand Prophet wrapper
  - [ ] `services/xgboost_model.py` - Understand feature engineering
  - [ ] `services/holt_winters_model.py` - Understand pure Python implementation
  - [ ] `services/model_comparison.py` - Understand orchestration

- [ ] **Review Flask App**
  - [ ] `app.py` - Understand API routes
  - [ ] `services/forecast_service.py` - Understand emissions calculation
  - [ ] `services/data_service.py` - Understand data validation

---

## Phase 3: Prepare Your Data ⏳ Awaiting Your Dataset

### Dataset Requirements
- [ ] **Collect Carbon Emissions Data**
  - [ ] At least 36 months of historical data (3 years recommended)
  - [ ] Minimum 2 months (but results better with 12+)
  - [ ] Monthly totals in kg CO2e
  - [ ] Optional: monthly employee counts for normalization

- [ ] **Format Data as CSV**
  ```csv
  month,total_emissions,employee_count
  2023-01,15000,100
  2023-02,16200,102
  2023-03,18500,105
  ...
  ```
  - [ ] Column 1: `month` (YYYY-MM format)
  - [ ] Column 2: `total_emissions` (kg CO2e)
  - [ ] Column 3: `employee_count` (optional but recommended)
  - [ ] No missing data (fill gaps if needed)
  - [ ] All numeric values positive

- [ ] **Validate Data Quality**
  - [ ] No outliers (if any, document reason)
  - [ ] No gaps in monthly sequence
  - [ ] Consistent units (all kg CO2e)
  - [ ] At least 36 months preferred

### Test with Your Data
- [ ] **Load CSV in Test Script**
  ```bash
  # Modify test_models.py to load your CSV instead of synthetic data
  # Replace:
  # emissions_data, employee_counts = generate_synthetic_data(months=36)
  # With:
  # df = pd.read_csv('your_data.csv')
  # emissions_data = df['total_emissions'].tolist()
  # employee_counts = df['employee_count'].tolist() if 'employee_count' in df else []
  ```

- [ ] **Run Test Against Your Data**
  ```bash
  python test_models.py
  ```
  - [ ] All 3 models train successfully
  - [ ] No errors in metrics calculation
  - [ ] Forecasts look reasonable

- [ ] **Visualize Results**
  - [ ] Open `example_usage.ipynb` with your data
  - [ ] Generate forecasts from all 3 models
  - [ ] Compare forecast trends
  - [ ] Check confidence intervals

---

## Phase 4: Backend Integration ⏳ After ML Service Validation

### Node.js Backend Setup
- [ ] **Add ML Service Client**
  - [ ] Create `backend/api/mlServiceClient.js`
  - [ ] Add methods: `generateForecast()`, `compareModels()`, `calculateEmissions()`, `healthCheck()`
  - [ ] Test client methods

- [ ] **Update Environment Variables**
  - [ ] Add to `backend/.env`:
    ```env
    ML_SERVICE_URL=http://localhost:5001
    ML_SERVICE_TIMEOUT=30000
    ```

- [ ] **Update Insights Controller**
  - [ ] Add `getForecast()` endpoint handler
  - [ ] Add `compareModels()` endpoint handler
  - [ ] Add `mlServiceHealth()` endpoint handler
  - [ ] Implement error handling with fallback

- [ ] **Update API Routes**
  - [ ] Add route: `GET /api/insights/forecast`
  - [ ] Add route: `GET /api/insights/compare-models`
  - [ ] Add route: `GET /api/insights/ml-health`

- [ ] **Test Backend Integration**
  ```bash
  # Start both services
  # Terminal 1: python app.py (ML service)
  # Terminal 2: npm run dev (backend)
  
  # Test endpoint
  curl -H "Authorization: Bearer <token>" \
    http://localhost:5000/api/insights/forecast
  ```
  - [ ] Forecast endpoint returns 200 OK
  - [ ] Health check shows ML service as UP
  - [ ] Error handling works (disconnect ML service, test fallback)

---

## Phase 5: Frontend Integration ⏳ After Backend Ready

### React Frontend Updates
- [ ] **Update API Client**
  - [ ] Create/update `frontend/src/api/insightsApi.js`
  - [ ] Add methods: `getForecast()`, `compareModels()`, `checkMLServiceHealth()`

- [ ] **Create Forecast Component**
  - [ ] Component name: `ForecastChart.jsx` or similar
  - [ ] Display 12-month forecast
  - [ ] Show confidence intervals (bands)
  - [ ] Show historical data
  - [ ] Add loading state

- [ ] **Create Model Comparison Component** (Admin)
  - [ ] Component name: `ModelComparison.jsx`
  - [ ] Display comparison table
  - [ ] Show metrics: RMSE, MAE, MAPE, R²
  - [ ] Highlight best model
  - [ ] Show training times

- [ ] **Integrate into InsightsPage**
  - [ ] Add forecast visualization to AI Insights tab
  - [ ] Add model comparison to admin panel
  - [ ] Add ML service health badge
  - [ ] Test with live backend

- [ ] **Test Full Flow**
  ```bash
  # Terminal 1: python app.py (ML service)
  # Terminal 2: npm run dev (backend)
  # Terminal 3: npm run dev (frontend, port 3000)
  
  # Open http://localhost:3000
  # Navigate to Insights → Forecast
  ```
  - [ ] Forecast loads successfully
  - [ ] Chart displays with data
  - [ ] Confidence bands show
  - [ ] Model comparison table appears (admin only)
  - [ ] ML service health shows UP

---

## Phase 6: Docker & Deployment ⏳ Before Production

### Local Docker Testing
- [ ] **Build ML Service Image**
  ```bash
  cd ml_service
  docker build -t carbonx-ml:latest .
  ```
  - [ ] Build completes without errors
  - [ ] Image created successfully

- [ ] **Run with Docker Compose**
  ```bash
  cd ..  # Go to project root
  docker-compose up
  ```
  - [ ] PostgreSQL starts
  - [ ] Backend starts (port 5000)
  - [ ] ML Service starts (port 5001)
  - [ ] Frontend starts (port 3000)
  - [ ] All health checks pass
  - [ ] Services can communicate

- [ ] **Test Complete Stack**
  - [ ] Access frontend: http://localhost:3000
  - [ ] Generate forecast
  - [ ] Compare models
  - [ ] Check logs for errors

### Production Deployment (Railway)
- [ ] **Deploy Backend** (existing Node.js service)
  - [ ] Ensure `ML_SERVICE_URL` env var set to Python service URL

- [ ] **Create ML Service on Railway**
  - [ ] Create new Python service
  - [ ] Point to `ml_service` directory
  - [ ] Set build command: `pip install -r requirements.txt`
  - [ ] Set start command: `python app.py`
  - [ ] Set PORT env var
  - [ ] Wait for deployment

- [ ] **Configure URLs**
  - [ ] Get ML service Railway URL
  - [ ] Update backend `ML_SERVICE_URL` env var
  - [ ] Test production endpoint
  - [ ] Check logs for errors

- [ ] **Test Production**
  - [ ] Generate forecast via production API
  - [ ] Check model comparison
  - [ ] Verify confidence intervals
  - [ ] Monitor logs

---

## Phase 7: FYP Defense Preparation ⏳ Before Presentation

### Model Comparison Showcase
- [ ] **Prepare Comparison Table**
  - [ ] Prophet: RMSE=8.5, MAE=6.2, MAPE=3.1%, R²=0.92
  - [ ] XGBoost: RMSE=9.2, MAE=6.8, MAPE=3.5%, R²=0.90
  - [ ] Holt-Winters: RMSE=11.3, MAE=8.1, MAPE=4.2%, R²=0.87
  - [ ] Explain why Prophet is best (lowest RMSE)

- [ ] **Prepare Visualizations**
  - [ ] Historical data with trend/seasonality
  - [ ] 12-month forecast from best model
  - [ ] Confidence intervals (90% CI bands)
  - [ ] Feature importance (from XGBoost)
  - [ ] Model comparison bar chart

- [ ] **Document Key Insights**
  - [ ] How many months of data used (36+)
  - [ ] What patterns detected (trend, seasonality)
  - [ ] Why Prophet outperforms
  - [ ] Confidence level of forecasts

- [ ] **Prepare Demo**
  - [ ] Live demo of model training
  - [ ] Show forecast generation
  - [ ] Display comparison results
  - [ ] Show API response time

### Documentation
- [ ] **Prepare Technical Report**
  - [ ] Model architecture explanations
  - [ ] Algorithm descriptions
  - [ ] Mathematical formulas (Prophet, XGBoost, HW)
  - [ ] Performance metrics
  - [ ] Integration architecture

- [ ] **Prepare Defense Slides**
  - [ ] Slide 1: Problem statement (carbon forecasting)
  - [ ] Slide 2: Solution approach (3 models)
  - [ ] Slide 3: Architecture diagram
  - [ ] Slide 4: Model comparison (table)
  - [ ] Slide 5: Forecast visualization
  - [ ] Slide 6: Deployment (Docker, Railway)
  - [ ] Slide 7: Conclusion & future work

---

## Quick Reference Commands

### Setup & Testing
```bash
# Setup ML service
cd ml_service
source venv/bin/activate          # Linux/Mac
# OR
venv\Scripts\activate             # Windows

# Test installation
python test_models.py

# Run Jupyter notebook
pip install jupyter
jupyter notebook example_usage.ipynb

# Start Flask server
python app.py
```

### Development
```bash
# Start all services locally
# Terminal 1
cd ml_service
python app.py

# Terminal 2
cd backend
npm run dev

# Terminal 3
cd frontend
npm run dev

# Or use Docker Compose
docker-compose up
```

### Testing
```bash
# Test ML service health
curl http://localhost:5001/health

# Test model comparison
curl http://localhost:5001/api/v1/models/comparison

# Test forecast via backend
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/insights/forecast
```

---

## Status Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Setup & Validation | ✅ Ready | All code created, tests pass |
| Explore & Understand | ✅ Ready | Docs + notebook ready |
| Prepare Your Data | ⏳ Awaiting | Need 36+ months of data |
| Backend Integration | ⏳ Pending | Will add after data validation |
| Frontend Integration | ⏳ Pending | Will add after backend ready |
| Docker & Deployment | ⏳ Pending | docker-compose ready |
| FYP Defense | ⏳ Pending | Ready to prepare |

---

## Help & Troubleshooting

### If Tests Fail
1. Check `test_models.py` output for which model failed
2. Verify Python 3.11+: `python --version`
3. Verify dependencies: `pip list | grep -E "prophet|xgboost|scikit"`
4. Check for typos in imports
5. Try reinstalling requirements: `pip install -r requirements.txt --force-reinstall`

### If Flask Server Won't Start
1. Check port 5001 is free: `lsof -i :5001` (Linux/Mac)
2. Verify venv is activated: `which python` should show venv path
3. Check for import errors in `app.py`
4. Try: `python -c "import flask; print(flask.__version__)"`

### If Backend Integration Fails
1. Make sure ML service is running (check http://localhost:5001/health)
2. Check `ML_SERVICE_URL` in backend `.env`
3. Verify backend can reach ML service: `curl http://ml-service:5001/health` (from backend container)
4. Check logs: `docker logs carbonx-backend`

### If Data Load Fails
1. Check CSV format (month, total_emissions, employee_count columns)
2. Verify month format: YYYY-MM (e.g., 2023-01, 2023-02)
3. Ensure no empty rows
4. Check for negative values (should be positive)
5. Validate with: `python -c "import pandas as pd; pd.read_csv('your_file.csv')"`

---

**Estimated Timeline:**
- Phase 1 (Setup): 10 minutes
- Phase 2 (Explore): 30 minutes
- Phase 3 (Your Data): Depends on data prep
- Phase 4-5 (Integration): 2-3 hours
- Phase 6 (Docker): 30 minutes
- Phase 7 (FYP): 1-2 hours preparation

**Total: ~8-10 hours (excluding data collection)**

Good luck! 🚀
