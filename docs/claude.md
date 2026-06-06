# CarbonX Development Chronicle

## Project Overview
**CarbonX** is a carbon emissions tracking platform for individuals and organizations in Pakistan. Real-time carbon footprint logging, AI-powered insights, personalized challenges, and sustainability analytics.

**Stack:**
- Backend: Node.js + Express + Prisma + PostgreSQL (Railway)
- Frontend: React + Vite + Tailwind + Framer Motion
- AI: Groq LLaMA 3.3 70B (free tier: 14,400 req/day)
- Deployment: Railway (auto git push → deploy)

---

## ✅ Completed Features

### **Phase 0 — Core Authentication & Setup**
- ✅ User registration + login with JWT
- ✅ Email normalization (case-insensitive): `email.trim().toLowerCase()`
- ✅ bcryptjs password hashing
- ✅ Role-based access control (USER / ADMIN)
- ✅ Admin account creation script

### **Phase 1 — Analytics Visual Overhaul**
- ✅ SustainabilityBanner: SVG progress ring, A-F grade scale, animated, clickable → ScoreModal explains how score is calculated (daily avg, consistency, trend)
- ✅ DonutChart: SVG-based, animated segments, category breakdown with %, legend
- ✅ MultiLineChart: 4-series (Total + Scope 1/2/3), dashed scopes, area gradient under total, grid lines
- ✅ AreaChart: For 7d/30d views, smooth animation
- ✅ KPI cards: 2xl totals, growth badges (↓ green = good, ↑ red = bad)
- ✅ Top Sources: Ranked #1-#6 with kg + %
- ✅ Category Cards: Color-coded, 2xl totals, animated progress bars
- ✅ Employee Comparison (admin): Horizontal bar chart with rankings
- ✅ Period selector: 7d / 30d / 6m / 12m
- ✅ Forecast tab removed from Analytics (moved to AI Insights)
- ✅ CSV Import button removed from Analytics header

### **Phase 2 — AI Insights (Recommendations, Challenges, Forecast, Offsets)**

#### Recommendations
- ✅ **AI-powered via Groq LLaMA** — fetches user's real 30-day data, sends to LLaMA, gets 3 personalized recommendations with actual kg numbers
- ✅ Fallback to rule-based if LLaMA fails or API key missing
- ✅ Each rec: title, summary (with actual numbers), category, priority (high/medium/low), icon, impact estimate, effort level, 3 action steps
- ✅ Pakistan-contextualised examples (daal, biryani, AC 26°C, etc.)
- ✅ Admin sees org-wide engagement recommendation

#### Challenges
- ✅ 10 static challenges: walk_week, meat_free_week, bus_month, energy_saver, no_beef_month, train_not_plane, carpool_week, led_switch, local_food_week, video_call_month
- ✅ UserChallenge model: tracks join status, startedAt, completedAt
- ✅ Challenge CRUD: list, join, complete, leave
- ✅ Frontend: 3 sections (Active / Completed / Available), stats row (active count, completed count, kg saved)
- ✅ Each challenge card: icon, difficulty, duration, estimated savings, tips, action buttons

#### AI Forecast
- ✅ **Holt-Winters Exponential Smoothing** (upgraded from linear regression)
- ✅ Detects trend (curved lines, not straight)
- ✅ Detects seasonality if 12+ months of data
- ✅ RMSE-based 90-95% confidence intervals
- ✅ Full chart visualization with historical (solid) + forecast (dashed) lines
- ✅ Month-by-month prediction cards with upper/lower bounds
- ✅ Model equation display (level, trend, seasonal component)
- ✅ Horizon selector: +3/6/9/12 months

#### Offset Projects
- ✅ 6 verified projects: 3 Pakistani (Sindh mangroves, solar micro-grid, clean cookstoves), 3 international
- ✅ Each project: standard (Gold Standard/VCS), location, type, price/tonne, SDG tags, description, registry links
- ✅ Admin-only view

### **Phase 2.5 — AI Enhancements (NEW)**
- ✅ AI-powered Recommendations (Groq LLaMA)
- ✅ Holt-Winters Time-Series Forecasting
- 🔨 **In Progress:**
  - [ ] AI Report Generator (admin)
  - [ ] AI Goal Setting (3/6/12 month targets)
  - [ ] AI Challenge Suggester (best challenge for your profile)

### **Chat + Saved Conversations**
- ✅ Groq LLaMA 3.3 integration (free tier)
- ✅ Language detection: English ↔ Roman Urdu auto-response
- ✅ System prompt injects user's real carbon data (total, by category, by scope, top source, 3-month trend)
- ✅ ChatGPT-style sidebar: conversation history grouped by date (Today / Yesterday / This Week / This Month)
- ✅ Auto-title from first message (truncates at 50 chars)
- ✅ SSE streaming text display with animated cursor
- ✅ Copy message button, stop button
- ✅ Status badge: "LLaMA 3.3 · Roman Urdu · data-aware" or amber "GROQ_API_KEY not configured"

### **CSV Bulk Import (Admin)**
- ✅ Drag-drop + click-to-browse UI
- ✅ Format spec card (columns: date, category, sub_category, quantity, description, user_email)
- ✅ Inline preview (first 8 rows)
- ✅ Download sample CSV button
- ✅ Validation: date (YYYY-MM-DD, past only), category/sub_category against whitelist, quantity (positive)
- ✅ Error list on failure
- ✅ Bulk insert to DB with cascade relations

### **Carbon Entry Calculator**
- ✅ Quick-log UI: category selector → sub_category → quantity → description
- ✅ Real-time emissions calculation (shows kg CO₂e as you type)
- ✅ Supports all 4 categories + 20+ sub-categories
- ✅ Entries saved to DB with entryDate

### **Leaderboard (Employee Comparison)**
- ✅ Ranked list of employees by total emissions
- ✅ #1/#2/#3 badges, kg per person, percentage of org total
- ✅ Avatar initials, admin-only edit/delete

---

## 📊 Data Models

```prisma
User {
  id: Int @id
  email: String @unique (normalized: lowercase + trimmed)
  password: String (hashed with bcryptjs)
  role: Role (USER | ADMIN)
  createdAt, updatedAt
  
  Relations:
  - carbonEntries: CarbonEntry[] (cascade delete)
  - conversations: Conversation[] (cascade delete)
  - userChallenges: UserChallenge[] (cascade delete)
}

CarbonEntry {
  id, userId, category, subCategory, quantity, description
  entryDate, valueKg (calculated from FACTORS)
  createdAt, updatedAt
}

Conversation {
  id, userId, title (auto-derived from first message, max 80 chars)
  createdAt, updatedAt
  
  Relations:
  - messages: Message[] (cascade delete)
}

Message {
  id, conversationId, role (user | assistant), content
  createdAt
}

UserChallenge {
  id, userId, challengeId (string, e.g. "walk_week")
  status: String (active | completed | abandoned)
  startedAt, completedAt
  
  Unique: [userId, challengeId]
  Cascade delete on user
}
```

---

## 🔌 API Endpoints

### **Auth**
- POST `/api/auth/register` — Create user
- POST `/api/auth/login` — JWT token
- GET `/api/auth/me` — Current user (requires JWT)

### **Carbon**
- POST `/api/carbon/entries` — Log entry
- GET `/api/carbon/entries` — List user's entries (with filtering)
- GET `/api/carbon/analytics?period=7days|30days|6months|year` — KPIs, charts, sustainability score
- POST `/api/carbon/bulk-upload` — Admin CSV import
- GET `/api/carbon/forecast?months=6` — Holt-Winters forecast
- GET `/api/carbon/leaderboard` — Employee ranking (admin-filtered org-wide)

### **Chat**
- POST `/api/chat` — Send message (SSE stream)
- GET `/api/chat/status` — Check Groq API health

### **Conversations**
- GET `/api/conversations` — List user's saved conversations
- GET `/api/conversations/:id` — Get conversation + messages
- POST `/api/conversations` — Create (auto-titled from first message)
- PATCH `/api/conversations/:id` — Rename (trim to 80 chars)
- DELETE `/api/conversations/:id` — Delete

### **Insights**
- GET `/api/insights/recommendations` — AI-powered (LLaMA) or rule-based fallback
- GET `/api/insights/challenges` — List all + user's join status
- POST `/api/insights/challenges/:id/join`
- PATCH `/api/insights/challenges/:id/complete`
- DELETE `/api/insights/challenges/:id/leave`
- GET `/api/insights/offset-projects` — Admin only

**NEW (In Progress):**
- POST `/api/insights/report` — Admin, generates full org report via LLaMA
- POST `/api/insights/goals` — AI suggests 3/6/12 month reduction targets
- POST `/api/insights/challenge-suggestion` — AI picks best challenge for user

---

## 🎨 Frontend Structure

```
frontend/src/
├── pages/dashboard/
│   ├── AnalyticsPage.jsx (8 sections: banner, donut, multiline, kpis, sources, categories, comparison, admin note)
│   ├── InsightsPage.jsx (4 tabs: Recommendations | Challenges | AI Forecast | Offset Projects [admin])
│   ├── ChatPage.jsx (2-panel: sidebar with history + main chat area + quick prompts)
│   ├── ActivitiesPage.jsx (Calculator + Leaderboard tabs)
│   └── AdminPage.jsx (CSV uploader)
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx (nav with all pages)
│   │   └── DashboardNav.jsx (breadcrumbs, user menu)
│   └── ...
├── api/
│   ├── carbonApi.js
│   ├── chatApi.js (includes insightsApi)
│   ├── insightsApi.js
│   └── axios.js (base config)
├── store/
│   └── authStore.js (Zustand)
└── utils/
    └── helpers.js
```

---

## 🎯 Emission Factors (kg CO₂e per unit)

**Commute:** car_petrol=0.192/km, car_diesel=0.171, car_electric=0.047, motorbike=0.114, bus=0.089, train=0.041, walking=0

**Energy:** electricity=0.45/kWh (Pakistan grid), natural_gas=2.1/m³, lpg=1.51/kg, diesel_gen=2.68/litre

**Travel:** flight_short=0.255/km, flight_long=0.195/km, car_rental=0.192/km, taxi=0.211/km

**Food:** beef=6.1/meal, chicken=0.86, fish=1.34, vegetarian=0.50, vegan=0.30

---

## 🤖 AI & ML

### **Groq LLaMA 3.3 70B Integration**
- **Chat:** Real-time conversation with carbon context
- **Recommendations:** Generates 3 personalized recommendations from user data
- **Goals:** Suggests realistic reduction targets
- **Challenge Suggester:** Picks optimal challenge
- **Report Generator:** Writes org sustainability report

**API Key:** `GROQ_API_KEY` (Railway env var, not local .env)

**Usage:** ~100-200 tokens per recommendation, ~500 tokens per report
**Free Tier Limit:** 14,400 requests/day (5 req/min rate limit)

### **Holt-Winters Exponential Smoothing**
- Pure JavaScript implementation (no external ML library)
- Handles trend (curved lines) + seasonality (12+ month patterns)
- Alpha=0.3 (level smoothing), Beta=0.1 (trend), Gamma=0.1 (seasonal)
- Returns: fitted values, forecast, RMSE, R², confidence intervals
- More accurate than linear regression for real emission data

### **Sustainability Score** (Rule-based)
- Base: 95 points if <1 kg/day, down to 22 if >30 kg/day
- Bonus: +8 for consistency (unique days logged), ±5 for trend
- Grade: A (85+), B (70+), C (55+), D (40+), F (<40)

---

## 🎨 Design System

**Color Palette (light theme):**
- Primary green: `#2D6A4F` (forest green, headings, primary buttons)
- Accent green: `#52B788` (lighter, secondary)
- Brown: `#C4952A` (warnings, secondary accent)
- Dark brown: `#8B5E3C` (tertiary)
- Neutral: `#9BAEA5` (muted text), `#7A9E8E` (body text)
- BG: `#F8F7F2` (off-white), `#ffffff` (cards)
- Border: `#E5EAE8`
- Status: green `#2D6A4F`, yellow `#C4952A`, red `#DC2626`

**Typography:**
- Headings: `font-bold`, `text-sm` (page) to `text-2xl` (KPI)
- Body: `text-xs` to `text-sm`, `font-medium`
- Monospace: `font-mono` for codes/data

**Components:**
- Cards: `rounded-xl`, `border: 1px solid #E5EAE8`, `p-5`, white background
- Buttons: `rounded-lg`, `font-semibold`, text-white on colored bg
- Badges: `rounded-full`, small `px-2.5 py-0.5`, colored bg + text
- Icons: Lucide React (`h-4 w-4` typical)
- Animations: Framer Motion for charts, page transitions

---

## 📝 Recent Git Commits

1. **Phase 1 Complete:** Analytics visual overhaul (banner, charts, KPIs, employee comparison)
2. **Phase 2 Foundation:** UserChallenge schema, 10 challenges, CRUD endpoints
3. **InsightsPage Rewrite:** 4 tabs (Recommendations, Challenges, Forecast, Offsets)
4. **AI Recommendations:** Groq LLaMA integration for personalized recommendations
5. **Holt-Winters Forecast:** Time-series forecasting with trend + seasonality detection

---

## 🚀 Current Session Tasks

### **Active Development:**

**AI Feature Suite (3 features):**

1. **AI Report Generator** (Admin)
   - Endpoint: POST `/api/insights/report`
   - Fetches org-wide data (total emissions, breakdown by category, top emitters, trends)
   - Sends to LLaMA: *"Generate a 2-page sustainability report for our organization..."*
   - Returns: markdown-formatted report with highlights, recommendations, commitment proposals
   - Frontend: Admin clicks "Generate Report" button → modal shows formatted report → download/export options

2. **AI Goal Setting**
   - Endpoint: POST `/api/insights/goals`
   - Fetches user's data + current trajectory
   - Sends to LLaMA: *"User emits 240 kg/month, down 5% from last month. Suggest realistic 3/6/12 month reduction goals..."*
   - Returns: 3 goal objects (period, target_kg, strategy, confidence)
   - Frontend: Card-based UI showing goals with progress visual

3. **AI Challenge Suggester**
   - Endpoint: POST `/api/insights/challenge-suggestion`
   - Analyzes user's top emission source + completed challenges + available challenges
   - Sends to LLaMA: *"User's top source is beef (35% of total). Here are available challenges. Which is most impactful?"*
   - Returns: challenge ID + reasoning
   - Frontend: Highlight suggested challenge in the Challenges tab, show "Recommended for you" badge

---

## 📌 Testing Credentials

- **Admin:** wardahzia4@gmail.com / Admin@123
- **User:** (create via signup, or use email from CSV import)

---

## 🔄 Deployment Pipeline

1. Commit to GitHub main branch
2. Railway auto-detects push
3. Runs `npm install` on both frontend + backend
4. Runs `npm run build` on frontend
5. Backend auto-runs `prisma db push` for schema updates
6. Frontend dist deployed to static hosting
7. Backend server restarts with new code

**Key env vars (set in Railway dashboard):**
- `DATABASE_URL` (PostgreSQL connection)
- `GROQ_API_KEY` (Groq API key)
- `JWT_SECRET` (for token signing)
- `PORT` (default 5000)

---

## ⚠️ Known Issues / Todos

- [ ] Build 3 new AI features (Report, Goals, Challenge Suggester)
- [ ] Code-split frontend bundle (currently 720KB, threshold is 500KB)
- [ ] Add password reset via email
- [ ] Department-level analytics (Phase 3)
- [ ] Admin org asset profiler (cars, ACs, etc.) (Phase 3)
- [ ] Dashboard redesign with real KPI sparklines (Phase 4)

---

## 📚 Key Files to Know

**Backend:**
- `backend/services/carbonService.js` — Carbon math (emission factors, analytics, Holt-Winters)
- `backend/controllers/insightsController.js` — Recommendations, Challenges, Offset Projects, new AI features
- `backend/routes/insightsRoutes.js` — Routes for insights endpoints
- `backend/prisma/schema.prisma` — All models + relations

**Frontend:**
- `frontend/src/pages/dashboard/InsightsPage.jsx` — 4-tab interface
- `frontend/src/pages/dashboard/AnalyticsPage.jsx` — 8-section dashboard
- `frontend/src/pages/dashboard/ChatPage.jsx` — Chat + conversation history
- `frontend/src/api/insightsApi.js` — API client for insights

---

## 🎓 Architecture Notes

- **Email normalization:** Every auth operation uses `email.trim().toLowerCase()` to avoid case-sensitivity bugs
- **Cascade deletes:** User deletion cascades to all entries, conversations, challenges
- **Real data injection:** Chat system fetches user's actual emissions and injects into system prompt for context-aware responses
- **Fallback strategies:** If LLaMA API fails, recommendations fall back to rule-based; forecast attempts HW then linear regression
- **No external ML libs:** Holt-Winters written in pure JavaScript (no NumPy, scikit-learn, etc.)
- **Time-series vs linear:** Holt-Winters detects trends (curved) and seasonality; linear regression assumes straight line forever

---

Generated: 2026-06-06
Last updated: Session with AI Report, Goal Setting, Challenge Suggester features (in progress)
