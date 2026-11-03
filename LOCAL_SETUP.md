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

## Demo organisation: carbonx-team

| Role | Name | Email | Password |
|---|---|---|---|
| Admin | Administrator | warabbasi4@gmail.com | CarbonX@Admin2026 |
| Students (11) | Wardah Zia Abbasi, Salma Imtiaz, Zoha Latif, Areesha Khawar, Tooba Zainab, Ayesha Shafiq Malik, Mahad Zulfiqar, Tayyaba Zahid, Alishba Amin, Haleema Sadia, Amber Imtiaz | `first.last@carbonx-team.test`, e.g. `wardah.abbasi@carbonx-team.test` (Ayesha is `ayesha.malik@…`) | CarbonX@Student1 |

Each student has the last 60 days of logs that match their story. Wardah and Salma drive (Wardah starts carpooling
partway through). Zoha lives in the hostel and goes home by intercity bus every other weekend. Everyone else takes
the university van or bus, with some ride-share, and Alishba mostly walks. Students have joined and completed
challenges, and three already have admin awards.

To re-seed from scratch (this also resets the 60-day window to end today), run `cd backend; node scripts/seedDemo.js --reset`.
Do this on the morning of a demo held on a later day.

## Admin: managing users and awards (Admin Panel → Users)
- **Add member**: creates an account in the admin's organisation.
- **Award** (medal icon): gives a named award with points and a reason. The student sees it under Activities → Awards.
- **Suspend / reactivate**: a suspended user cannot log in.
- **Make / remove admin**, **Delete**.
- New sign-ups automatically join `DEFAULT_ORGANIZATION` (carbonx-team).

## How awards are calculated (last 60 days, `backend/services/awardsService.js`)
| Source | Points |
|---|---|
| Low footprint | 0–200: the lowest CO₂e in the organisation gets 200, the highest gets 0 |
| Improvement | 5 per % cut in the last 30 days vs the 30 before, max 150 |
| Consistency | 2 per day with a logged entry, max 100 |
| Challenges | 50 + kg saved per completed challenge, 10 per active one |
| Admin awards | The points the admin attached |

Tiers: Bronze 0+, Silver 180+, Gold 300+, Platinum 450+. Automatic badges: Eco Champion (rank 1), Lowest Footprint,
Most Improved, Challenge Master / Finisher, Green Commuter (no car or taxi trips), Consistent Logger (45+ days).

## Notes
- The first forecast per user takes about 10–15 s (it trains Prophet, XGBoost and Holt-Winters). After that it is cached for 24 h.
- Requirements: Node.js 20+ and Python 3.10+.
