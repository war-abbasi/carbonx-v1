# Running CarbonX locally (no Railway / Vercel / cloud DB)

| Piece | Was (cloud) | Now (local) |
|---|---|---|
| Database | MySQL on Railway | SQLite file `backend/prisma/carbonx.db` (Prisma) |
| Backend API | Railway | `node server.js` on http://localhost:5000 |
| ML forecasting | Railway (Flask) | `ml_service` venv on http://localhost:5001 |
| Frontend | Vercel | Vite dev server on http://localhost:3000 (proxies `/api` → 5000) |
| AI | Groq SDK, hard-coded | Any OpenAI-compatible API, set in `backend/.env` |

## 1. Add an AI key

Open `backend/.env` and set `LLM_API_KEY=` to your Google Gemini key (free from https://aistudio.google.com/apikey). Gemini is configured by default. To use Groq, OpenRouter or OpenAI instead,
copy that provider's `LLM_BASE_URL` / `LLM_MODEL` lines from the comments above it. Then run `cd backend; npm run check-ai` to confirm it answers, and restart the backend.

If no key is set, everything except AI Chat still works: recommendations, goals, challenge suggestions and
reports fall back to rule-based output built from the user's data.

## 2. Start everything

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

This installs any missing dependencies, syncs the database, seeds demo data (only the first time), and opens three
windows: ML service, backend and frontend. Then open http://localhost:3000.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@carbonx.com | Admin@CarbonX1 |
| User | demo@carbonx.com | Demo@CarbonX1 |
| Employees | employee1..4@carbonx.com | Employee@CarbonX1 |

Each account has 18 months of realistic Pakistan-context entries, with summer AC and winter gas seasonality, so
CarboncastX forecasts and Analytics have data to show. To re-seed from scratch, run `cd backend; node scripts/seedDemo.js --reset`.

## Notes
- The first forecast per user takes about 10–15 s (it trains Prophet, XGBoost and Holt-Winters). After that it is cached for 24 h.
- Requirements: Node.js 20+ and Python 3.10+.
