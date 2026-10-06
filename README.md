# Defiy OS

**One AI that helps you run your life.**

Defiy OS is an AI-powered personal life coach and assistant — not a fitness tracker, not a chatbot. It unifies an AI coach, fitness, nutrition, sleep, habits, goals, school/productivity, notes, finance, wellbeing, reminders, XP progression, and weekly reviews into one coherent, mobile-first product where the AI connects everything together.

## What's inside

- **Home dashboard** — time-aware greeting, Quote of the Day, Today's Focus, and live stat cards (workout, reminders, school tasks, nutrition, sleep, goals, habits, XP).
- **Central AI chat** — your personal coach. It remembers your context (goals, recent workouts, meals, sleep, assignments, savings) and can *take actions*: create reminders, log meals and workouts, create goals and assignments, plan study sessions, and confirm each action clearly.
- **Voice input** — microphone button in chat records your speech (Web Speech API), shows an editable transcript, then sends. AI messages have a speaker button using real device text-to-speech.
- **Fitness** — exercise library, workout plans, set/rep/weight/RIR logging, PRs, AI workout generation (goal, equipment, time), volume and consistency charts.
- **Nutrition** — meal logging with portions, an AI meal-photo flow (identifies foods, estimates portions — always labeled as estimates), daily/weekly totals, hydration, and honest nutrient-pattern analysis ("possible gap" language, never diagnoses).
- **Sleep & recovery** — sleep logs, quality/energy/soreness/fatigue tracking, trends, and recovery-aware training suggestions.
- **Habits** — daily check-offs, streaks, weekly completion; consistency over perfection, never guilt-based.
- **Goals** — any category, measurable targets, milestones, visual progress, deadlines.
- **School / productivity** — classes, assignments, tests, study sessions, AI study plans ("I have a chemistry test Friday" → a week of sessions).
- **Notes** — categories, favorites, full-text search.
- **Finance** — income/expense/savings tracking, savings goals with progress, spending breakdown, general financial education (not a licensed advisor).
- **Wellbeing** — mood and stress check-ins, journaling, supportive nonjudgmental AI guidance, crisis-safe behavior.
- **XP & levels** — earn XP for workouts, study, habits, logging, progress. Motivating, not punishing.
- **Weekly review** — a real recap computed from your actual data: workouts, study minutes, habit completion, sleep trends, savings, goal progress, and a suggested focus.
- **Onboarding** — short, skippable, ends with a personalized dashboard.
- **Settings** — profile, notifications (with honest push status), voice, AI preferences, privacy, data export, theme, units.

## Honest by design

- **No fake AI.** Without a Gemini key the chat says the engine isn't connected yet (and explicit commands still work). With a key, everything runs server-side — keys are never exposed to the client.
- **No fake push.** Reminders are fully modeled (scheduling, recurrence, pre-event timing, device tokens) with a clean `NotificationBackend` interface; until a provider (Expo/FCM/APNs) is wired, the app tells you push isn't connected instead of pretending.
- **No fake data.** Real accounts start empty. A clearly-labeled demo account ships with sample data so you can see the UI in action.
- **No invented nutrition.** AI photo analysis identifies foods and estimates portions; values come from the built-in food reference table or your own entries, and are flagged as estimates.
- **Safety guardrails.** The AI never diagnoses, never claims to be a doctor/therapist/financial advisor, avoids extreme diet and training advice, uses age-appropriate recommendations, and points to qualified professionals when it matters.

## Tech stack

| Layer | Tech |
| --- | --- |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2, JWT auth (stdlib PBKDF2 hashing) |
| Database | SQLite by default, Postgres via `DATABASE_URL` |
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, recharts, lucide-react |
| AI | Google Gemini (server-side, structured JSON + action registry) |

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000 (docs at `/docs`).

### 2. Demo data (optional)

```bash
python -m app.seed
```

Creates a demo account — `demo@defiy.os` / `demo1234` — with two weeks of realistic sample data.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173.

### 4. Enable the AI engine (optional)

Get a key from Google AI Studio, then start the backend with:

```bash
GEMINI_API_KEY=your-key-here uvicorn app.main:app --reload
```

### Production

Docker: `docker compose up --build` (backend on 8000, frontend on 5173). Set `JWT_SECRET`, `DATABASE_URL`, and `GEMINI_API_KEY` per `.env.example`. Use a real Postgres database in production.

## Project structure

```
defiy-os/
├── backend/
│   ├── app/
│   │   ├── ai/            # Gemini adapter, prompts, action registry, fallback parser
│   │   ├── api/           # Routers: auth, chat, goals, fitness, nutrition, ...
│   │   ├── data/          # Food reference table, exercise seed
│   │   ├── models/        # SQLAlchemy models (one file per domain)
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # quotes, XP, notifications interface, patterns, reviews
│   │   ├── config.py      # All settings via environment
│   │   ├── database.py
│   │   ├── main.py
│   │   └── seed.py        # Clearly-labeled demo account
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/           # Typed API client + endpoints
│       ├── components/    # UI kit, layout, chat components
│       ├── context/       # Auth, theme
│       ├── hooks/         # Speech recognition, speech synthesis, toasts
│       └── pages/         # Onboarding, Home, Chat, Track, Goals, School, ...
└── docker-compose.yml
```

## Integrating real services later

The architecture is built so these plug in without rewrites:

- **Push notifications** — implement `NotificationBackend` in `backend/app/services/notifications.py` (Expo, FCM, or APNs); device tokens are already stored.
- **AI engine** — set `GEMINI_API_KEY` (chat, meal photos, workout/study generation all route through the adapter).
- **Nutrition database** — swap the built-in reference table for the USDA FoodData Central API behind the same lookup function.
- **Voice** — richer STT/TTS providers slot behind the existing speech hooks.
