# CarbonX System Architecture Overview

## High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    CARBONX PLATFORM                             │
└──────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │   Browser   │
                            │   (React)   │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │                             │
                    ▼                             ▼
         ┌──────────────────┐          ┌──────────────────┐
         │  React Frontend  │          │   Static Assets  │
         │  (Port 3000)     │          │   (CSS, JS)      │
         └────────┬─────────┘          └──────────────────┘
                  │
                  │ HTTP REST API
                  │
                  ▼
    ┌─────────────────────────────────┐
    │   Node.js Express Backend       │
    │   (Port 5000)                   │
    ├─────────────────────────────────┤
    │ ✓ Authentication (JWT)          │
    │ ✓ User Management               │
    │ ✓ Carbon Entry CRUD             │
    │ ✓ Analytics Calculation         │
    │ ✓ Chat Integration (Groq)       │
    │ ✓ ML Service Orchestration      │
    ├─────────────────────────────────┤
    │ Routes:                         │
    │ • /api/auth/*                   │
    │ • /api/carbon/*                 │
    │ • /api/chat/*                   │
    │ • /api/insights/*               │
    │ • /api/conversations/*          │
    └─────────┬───────────────────────┘
              │
       ┌──────┴──────┬──────────────┬──────────────┐
       │             │              │              │
       ▼             ▼              ▼              ▼
    ┌──────┐  ┌──────────┐  ┌────────────┐  ┌────────┐
    │ DB   │  │ML Service│  │Groq API    │  │Redis   │
    │(PG)  │  │(Port5001)│  │(Chat/LLM)  │  │(Cache) │
    └──────┘  └──────────┘  └────────────┘  └────────┘
```

---

## ML Service Deep Dive

```
┌────────────────────────────────────────────────────────────┐
│              PYTHON ML MICROSERVICE                        │
│              (Port 5001 - Standalone)                      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │  Flask REST API             │
            │  (app.py)                   │
            └────────────┬────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌────────┐      ┌──────────┐     ┌──────────┐
   │ Health │      │ Forecast │     │Emissions │
   │ Check  │      │ Generation       │Calc     │
   └────────┘      └──────────┘     └──────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Services Layer                │
        ├────────────────────────────────┤
        │                                │
        │  ┌──────────────────────────┐ │
        │  │ Model Comparison Service │ │
        │  │ • Orchestrates training  │ │
        │  │ • Selects best model     │ │
        │  │ • Generates metrics      │ │
        │  └──────────────────────────┘ │
        │                                │
        │  ┌──────────────────────────┐ │
        │  │ Forecast Service         │ │
        │  │ • Emissions factors      │ │
        │  │ • Scope 1/2/3 calc       │ │
        │  │ • Feature engineering    │ │
        │  └──────────────────────────┘ │
        │                                │
        │  ┌──────────────────────────┐ │
        │  │ Data Service             │ │
        │  │ • Data validation        │ │
        │  │ • Format checking        │ │
        │  │ • Error tracking         │ │
        │  └──────────────────────────┘ │
        │                                │
        └────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Prophet  │  │ XGBoost  │  │HW (Pure  │
    │ Model    │  │ Model    │  │Python)   │
    │          │  │          │  │Model     │
    │ Facebook │  │Gradient  │  │Exponential│
    │Prophet   │  │Boosting  │  │Smoothing │
    │          │  │          │  │          │
    │2.3s      │  │1.8s      │  │0.1s      │
    │RMSE:8.5  │  │RMSE:9.2  │  │RMSE:11.3 │
    │R²:0.92   │  │R²:0.90   │  │R²:0.87   │
    └──────────┘  └──────────┘  └──────────┘
```

---

## Data Flow: Forecast Generation

```
USER INITIATES FORECAST REQUEST
         │
         ▼
Node Backend (GET /api/insights/forecast)
         │
         ├─ Fetch user's carbon entries (36+ months)
         ├─ Group by month (sum daily totals)
         ├─ Extract employee counts (if available)
         │
         ▼
Call ML Service (POST /api/v1/forecast/generate)
{
  organization_id: "org_123",
  historical_data: [150, 160, 175, ...],  // Monthly totals
  months_ahead: 12,
  features: {
    employee_counts: [100, 105, 110, ...],
    start_date: "2023-01-01"
  }
}
         │
         ▼
ML Service App Handler
         │
         ├─ Validate input
         ├─ Check data length (need 36+ months)
         │
         ▼
Model Comparison Service
         │
    ┌────┴────┬──────────┬──────────────┐
    │          │          │              │
    ▼          ▼          ▼              ▼
Train      Train      Train         Fetch
Prophet   XGBoost    HW Model     Metrics
in        in        in parallel   & Results
parallel  parallel  (0.1s)        from all
(2.3s)    (1.8s)                  3 models
    │          │          │              │
    └────┬─────┴──────────┴──────────────┘
         │
         ▼
Evaluate & Compare Metrics
┌─────────────────────────────────────────┐
│ Prophet      XGBoost     Holt-Winters  │
│ RMSE: 8.5    RMSE: 9.2   RMSE: 11.3    │
│ MAE: 6.2     MAE: 6.8    MAE: 8.1      │
│ R²: 0.92 ✓   R²: 0.90    R²: 0.87      │
│ >>> WINNER (lowest RMSE)                │
└─────────────────────────────────────────┘
         │
         ▼
Generate Forecasts
┌─────────────────────────────────────────┐
│ Best Model (Prophet):                   │
│ Month 1: 245.6 (90% CI: 232-259)       │
│ Month 2: 248.3 (90% CI: 235-261)       │
│ ...                                     │
│ Month 12: 280.1 (90% CI: 266-294)      │
└─────────────────────────────────────────┘
         │
         ▼
Return Response to Backend
{
  organization_id: "org_123",
  models: {
    prophet: { metrics: {...}, forecast: [...] },
    xgboost: { metrics: {...}, forecast: [...] },
    holt_winters: { metrics: {...}, forecast: [...] }
  },
  best_model: "prophet"
}
         │
         ▼
Backend Returns to Frontend
         │
         ▼
DISPLAY FORECAST IN UI
┌─────────────────────────────────┐
│  Monthly Forecast Chart         │
│                                 │
│  Historical ───→ Forecast       │
│  ─────────────────────────      │
│      ╱╲    ╱╲    ╱╲    ╱╲       │
│     ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲      │
│        ╲╱        ╲╱    ╲╱       │
│                                 │
│  with 90% Confidence Bands      │
│  ═══════════════════════════    │
│        (shaded region)          │
└─────────────────────────────────┘
```

---

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Node.js)                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ insightsController.js                              │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • getForecast()     ──┐                             │   │
│  │ • compareModels()   ──┼──→ mlServiceClient.js      │   │
│  │ • mlServiceHealth() ──┘                             │   │
│  │ • getRecommendations()                              │   │
│  │ • getChallenges()                                   │   │
│  │ • getOffsetProjects()                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                 │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ mlServiceClient.js                                  │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • generateForecast()    ──┐                         │   │
│  │ • compareModels()       ──┼──→ HTTP POST/GET        │   │
│  │ • calculateEmissions()  ──┤    to ML Service        │   │
│  │ • healthCheck()         ──┘    (Port 5001)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ML SERVICE (Python)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ app.py (Flask Routes)                              │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • POST /api/v1/forecast/generate                    │   │
│  │ • GET /api/v1/models/comparison                     │   │
│  │ • POST /api/v1/emissions/calculate                  │   │
│  │ • GET /health                                       │   │
│  └──────────┬──────────────────────────────────────────┘   │
│             │                                               │
│             ▼                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ services/model_comparison.py                        │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • compare_models()          ┐                       │   │
│  │ • select_best_model()       │                       │   │
│  │ • create_summary_table()    └──→ Orchestrates       │   │
│  │                                 all 3 models       │   │
│  └────┬────────────────────────────────────────────────┘   │
│       │                                                     │
│  ┌────┴────┬──────────────┬──────────────────────┐         │
│  │          │              │                      │         │
│  ▼          ▼              ▼                      ▼         │
│ ┌─────┐  ┌──────┐  ┌────────┐  ┌───────────────┐          │
│ │ Prophet ModelXGBoost  HoltWintersForecaster    │          │
│ │       │  │ Forecaster         Service        │          │
│ │       │  │      │                 │          │          │
│ │ train()│ │train() │train()   engineer_features│          │
│ │ forecast│ │forecast  forecast      calc       │          │
│ │ metrics │ │metrics   metrics   emissions       │          │
│ └──────────┴──────────┴────────────┴───────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ InsightsPage.jsx                                    │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • Recommendations Tab    ──┐                        │   │
│  │ • Challenges Tab         ──┼──→ API Calls          │   │
│  │ • AI Forecast Tab        ──┤                        │   │
│  │ • Offset Projects Tab    ──┘                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                 │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ insightsApi.js (API Client)                         │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • getForecast()  ──┐                                │   │
│  │ • compareModels()──┼──→ HTTP GET/POST              │   │
│  │ • checkMLHealth()──┘    to Backend API             │   │
│  │                         (Port 5000)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                 │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Components                                          │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • ForecastChart.jsx          (Display 12mo chart) │   │
│  │ • ConfidenceIntervals.jsx    (Show uncertainty)   │   │
│  │ • ModelComparison.jsx        (Metrics table)      │   │
│  │ • MLServiceStatus.jsx        (Health badge)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Development (Local)

```
┌─────────────────────────────────────────────────────────┐
│ Developer Machine                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Terminal 1: python app.py        (Port 5001)          │
│  Terminal 2: npm run dev (backend) (Port 5000)         │
│  Terminal 3: npm run dev (frontend)(Port 3000)         │
│                                                         │
│  All communicate via localhost                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Local Docker

```
┌─────────────────────────────────────────────────────────┐
│ Docker Compose (docker-compose.yml)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Service 1: postgres (Port 5432)                       │
│  Service 2: backend  (Port 5000)                       │
│  Service 3: ml-service (Port 5001)                    │
│  Service 4: frontend (Port 3000)                       │
│                                                         │
│  All on same Docker network                            │
│  Volumes for development                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Production (Railway)

```
┌────────────────────────────────────────────────────────────┐
│ Railway.app (Cloud Deployment)                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Service 1: PostgreSQL (Railway-provided)            │ │
│  │ DATABASE_URL = postgresql://...railway.app         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Service 2: Node Backend (Port $PORT=5000)           │ │
│  │ Env: ML_SERVICE_URL = https://carbonx-ml.railway.app│ │
│  │ Env: JWT_SECRET, GROQ_API_KEY, DATABASE_URL        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Service 3: Python ML (Port $PORT=5001)              │ │
│  │ Env: FLASK_ENV=production                           │ │
│  │ Env: DATABASE_URL (same as backend)                 │ │
│  │ Build: pip install -r requirements.txt              │ │
│  │ Start: python app.py                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Service 4: React Frontend                           │ │
│  │ (Static files served from backend or separate CDN)  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Data Models Relationship

```
┌──────────────────────────────────────────────────────────────┐
│ PostgreSQL Database Schema                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │    User     │                                            │
│  ├─────────────┤                                            │
│  │ id (PK)     │────┐                                       │
│  │ email       │    │                                       │
│  │ password    │    │                                       │
│  │ role        │    │                                       │
│  │ createdAt   │    │                                       │
│  └─────────────┘    │                                       │
│         │           │                                       │
│         │ 1:N       │                                       │
│         ▼           │                                       │
│  ┌──────────────┐   │    ┌──────────────────┐             │
│  │ CarbonEntry  │   │    │   Conversation   │             │
│  ├──────────────┤   │    ├──────────────────┤             │
│  │ id (PK)      │   │    │ id (PK)          │             │
│  │ userId (FK) ─┘   │    │ userId (FK) ──┐  │             │
│  │ category     │    │    │ title           │  │             │
│  │ subCategory  │    │    │ createdAt       │  │             │
│  │ quantity     │    │    └──────────────────┘  │             │
│  │ description  │    │         │                │             │
│  │ valueKg      │    │         │ 1:N            │             │
│  │ entryDate    │    │         ▼                │             │
│  │ createdAt    │    │    ┌──────────────────┐ │             │
│  └──────────────┘    │    │   Message        │ │             │
│                      │    ├──────────────────┤ │             │
│                      │    │ id (PK)          │ │             │
│                      │    │ conversationId   │ │             │
│                      │    │ role             │ │             │
│                      │    │ content          │ │             │
│                      │    │ createdAt        │ │             │
│                      │    └──────────────────┘ │             │
│                      │                         │             │
│                      └────────────────────────┘             │
│                                                              │
│  ┌──────────────────────┐                                   │
│  │   UserChallenge      │                                   │
│  ├──────────────────────┤                                   │
│  │ id (PK)              │                                   │
│  │ userId (FK) ─────────┼───── to User                     │
│  │ challengeId          │                                   │
│  │ status               │                                   │
│  │ startedAt            │                                   │
│  │ completedAt          │                                   │
│  └──────────────────────┘                                   │
│                                                              │
│ Key Relations:                                              │
│  • User 1:N CarbonEntry (cascade delete)                  │
│  • User 1:N Conversation (cascade delete)                 │
│  • Conversation 1:N Message (cascade delete)              │
│  • User 1:N UserChallenge (cascade delete)                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow Example

### Scenario: User Requests Forecast

```
1. FRONTEND (React)
   ├─ User clicks "Generate Forecast"
   ├─ ForecastChart.jsx → getForecast() from insightsApi
   │
   └─► HTTP GET /api/insights/forecast?months=12
       Headers: { Authorization: "Bearer <JWT_TOKEN>" }


2. BACKEND (Node.js)
   ├─ Route handler: GET /api/insights/forecast
   ├─ Extract userId from JWT token
   ├─ Query all user's carbon entries from DB
   ├─ Group by month: [150, 160, 175, 190, ...]
   ├─ Get employee counts (if available)
   │
   └─► HTTP POST http://ml-service:5001/api/v1/forecast/generate
       Body: {
         organization_id: "org_123",
         historical_data: [150, 160, 175, 190, ...],
         months_ahead: 12,
         features: {
           employee_counts: [100, 105, 110, ...],
           start_date: "2023-01-01"
         }
       }


3. ML SERVICE (Python Flask)
   ├─ Parse request
   ├─ Validate data (36+ months required)
   ├─ Call ModelComparison.compare_models()
   │
   ├─► Train Prophet (2.3s) ┐
   ├─► Train XGBoost (1.8s) ├─ Parallel
   └─► Train HW (0.1s)      ┘
   
   ├─ Calculate metrics for all 3
   ├─ Compare RMSE: Prophet=8.5 (WINNER)
   ├─ Generate 12-month forecasts
   │
   └─► HTTP 200 Response
       Body: {
         organization_id: "org_123",
         timestamp: "2026-01-15T10:30:00Z",
         models: {
           prophet: {
             metrics: { rmse: 8.5, mae: 6.2, r2: 0.92 },
             forecast: [
               { month: "2026-02", predicted: 245.6, lower: 232.1, upper: 259.1 },
               ...
             ]
           },
           xgboost: { ... },
           holt_winters: { ... }
         },
         best_model: "prophet"
       }


4. BACKEND (Node.js)
   ├─ Receive ML service response
   ├─ Cache result (optional)
   │
   └─► HTTP 200 to Frontend
       Body: {
         success: true,
         forecast: <ML_SERVICE_RESPONSE>,
         timestamp: "2026-01-15T10:30:00Z"
       }


5. FRONTEND (React)
   ├─ Receive forecast
   ├─ Extract best model's forecast
   ├─ Prepare chart data:
   │  - Historical: [150, 160, 175, ...]
   │  - Forecast: [245.6, 248.3, ..., 280.1]
   │  - CI: [{lower: 232.1, upper: 259.1}, ...]
   │
   └─► Render ForecastChart
       ├─ Plot historical line
       ├─ Plot forecast line (dashed)
       ├─ Shade confidence bands
       └─ Display metrics summary
```

---

## Architecture Strengths

✅ **Microservices:** ML service independent from backend (can scale separately)
✅ **Model Comparison:** All 3 models trained, best selected automatically
✅ **Fast Training:** ~2.3s total for all models on 36-month data
✅ **Confidence Intervals:** 90% CI on all forecasts
✅ **Error Handling:** Graceful fallback if ML service unavailable
✅ **Containerized:** Docker support for easy deployment
✅ **Pakistan-Specific:** Emission factors tuned for Pakistan grid
✅ **Extensible:** Easy to add new models or features

---

## Performance Characteristics

| Component | Latency | Throughput | Notes |
|-----------|---------|-----------|-------|
| Frontend render | 100-200ms | 60 FPS | Smooth animations |
| Backend API | 50-100ms | 100+ req/s | Node.js async |
| ML inference | 2000-3000ms | 1 forecast/s | CPU-bound training |
| Database query | 10-50ms | 1000+ req/s | PostgreSQL |
| Total e2e latency | ~2500ms | 1 forecast/s | User sees 2.5s delay |

---

**This architecture supports all current and planned CarbonX features while maintaining clear separation of concerns and scalability for future growth.**
