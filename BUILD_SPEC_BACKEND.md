# Defiy OS — Backend Build Spec (authoritative)

Project: "Defiy OS" — an AI personal life coach & assistant app ("One AI that helps you run your life").
Stack: FastAPI + SQLAlchemy 2 + Pydantic v2 + JWT auth. Python 3.11. SQLite default, Postgres via DATABASE_URL.
Existing files you MUST keep consistent with (already written):
- backend/requirements.txt (fastapi, uvicorn, SQLAlchemy, pydantic, pydantic-settings, PyJWT, httpx, pytest)
- backend/app/config.py (Settings: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, GEMINI_MODEL, AI_ENABLED, PUSH_PROVIDER, ALLOWED_ORIGINS, PBKDF2_ITERATIONS, API_PREFIX="/api")
- backend/app/database.py (Base, engine, SessionLocal, get_db)
- backend/app/models/mixins.py (created_col(), updated_col(), utcnow())
- backend/app/models/core.py (User, Profile, Conversation, Message, AIRecommendation, DeviceToken — COMPLETE, do not change)

## Non-negotiable honesty rules
- Never fake AI: if GEMINI_API_KEY is unset, /api/chat returns a normal reply that says the AI engine is not connected yet and gives the exact env var to set, while still executing explicitly-parsed commands (below).
- Never fake push notifications: reminders are stored with notification_status="not_connected" until a real provider is wired. There is a services/notifications.py with a clean NotificationBackend interface + a NotConnectedBackend default and clear docstrings for adding Expo/FCM later. The API exposes GET /api/notifications/status so the UI can show the true state.
- AI nutrition photo analysis returns ESTIMATES flagged is_estimate=True; the UI must be able to label them. Gemini never invents "exact" values: the prompt must demand ranges/estimates and identify foods + portions only; nutrition values come from the built-in food reference table (backend/app/data/foods.py, ~60 common foods with USDA-style values, clearly documented as a starter reference) or user-entered values.
- No medical/financial claims. Safety guardrails live in ai/prompts.py system prompt (also enforces: no diagnosing, no therapist claims, no licensed financial advisor claims, no extreme dieting, age-appropriate advice, crisis resources on serious mental-health situations, "possible gap / discuss with a healthcare professional" language for nutrient patterns).
- Demo data only via explicit seed on a demo@defiy.os account (backend/seed.py), NEVER mixed into real accounts. Every user's data isolated (user_id FK on everything; queries always filter by user).

## Data model (SQLAlchemy models — finish these files; follow core.py style exactly)
- models/fitness.py: Exercise(id,user_id,name unique-per-user,muscle_groups JSON list,equipment JSON list,category str,instructions Text,is_ai_generated Bool), Workout(id,user_id,title,date DateTime,status planned|completed|skipped,duration_minutes int,source manual|ai,plan_data JSON,notes Text), WorkoutExercise(id,user_id,workout_id FK,exercise_id FK nullable,name,order_index,target_sets,target_reps,target_weight float,target_rir int,rest_seconds int,notes), WorkoutSet(id,user_id,workout_exercise_id FK,set_number,reps int,weight float,rir int,duration_seconds int,completed Bool), PersonalRecord(id,user_id,exercise_name,metric weight|reps|duration,value float,unit,workout_id FK nullable,date DateTime)
- models/nutrition.py: Meal(id,user_id,title,meal_type breakfast|lunch|dinner|snack,date DateTime,source manual|photo|ai,photo_url Text nullable,confirmed Bool,notes), MealItem(id,user_id,meal_id FK,name,quantity float,unit str,calories float,protein_g,carbs_g,fat_g,fiber_g,micronutrients JSON,is_estimate Bool), HydrationEntry(id,user_id,date,ml int)
- models/wellness.py: SleepEntry(id,user_id,date,bedtime,wake_time,total_minutes int,quality 1-5,energy 1-5,soreness 1-5,fatigue 1-5,notes), MoodEntry(id,user_id,date,mood 1-5,stress 1-5,journal Text,tags JSON), Habit(id,user_id,name,icon,color,frequency daily|weekly,target_per_week int,active Bool), HabitCompletion(id,user_id,habit_id FK,date,note)
- models/goals.py: Goal(id,user_id,name,category,target_value float nullable,current_value float,unit nullable,deadline DateTime nullable,status active|completed|paused,notes), GoalMilestone(id,user_id,goal_id FK,name,target_value float,completed Bool,completed_date DateTime)
- models/school.py: SchoolClass(id,user_id,name,teacher,schedule,color), Assignment(id,user_id,class_id FK nullable,title,type homework|project|test|quiz,due_date DateTime,status pending|completed,notes), StudySession(id,user_id,assignment_id FK nullable,class_id FK nullable,topic,date,minutes int,notes,completed Bool)
- models/notes.py: Note(id,user_id,title,content Text,category,favorite Bool,tags JSON)
- models/finance.py: FinanceEntry(id,user_id,kind income|expense|savings,amount float,category,description,date), SavingsGoal(id,user_id,name,target_amount float,current_amount float,deadline nullable,status active|completed,notes)
- models/gamification.py: XPEvent(id,user_id,points int,reason,source_type,source_id), Achievement(id,code unique,name,description,icon,points_required int nullable), UserAchievement(id,user_id,achievement_id FK,earned_date), WeeklyReview(id,user_id,week_start DateTime,data JSON,summary Text)
- models/reminders.py: Reminder(id,user_id,title,description Text,remind_at DateTime,repeat none|daily|weekly|monthly,repeat_day int 0-6,notify_minutes_before int default 10,category,completed Bool,notification_status pending|sent|not_connected)
- models/__init__.py imports everything so Base.metadata is complete.
Every model: created_date/updated_date via created_col()/updated_col(), user_id FK to users.id ondelete CASCADE + index.

## Auth (api/auth.py)
POST /api/auth/register {email,password} -> {token,user}; POST /api/auth/login -> {token,user}; GET /api/auth/me. Passwords: stdlib pbkdf2_hmac sha256, salt hex + "$" + hash hex stored as password_hash; verify in constant time. JWT: PyJWT HS256, payload {user_id, exp}; bearer token, get_current_user dependency. Pydantic schemas in schemas/.

## REST routers (all under /api, all scoped to current user; standard CRUD: list (with ?limit, pagination via skip), create, get, update, delete where sensible)
- /api/profile (GET, PUT — onboarding answers & prefs; PUT sets onboarded=True when name present)
- /api/quotes/today — deterministic daily pick from services/quotes.py (~80 original motivational lines, keyed by date + user goals category; NOT copyrighted quotes)
- /api/dashboard — one call powering Home: greeting name, quote, today's focus list (built from: incomplete reminders today, planned workout, due assignments, habit streak, savings delta, active goal nearest-deadline), plus stat cards (today's workout, upcoming reminders, school tasks due, today's calories vs profile target, last sleep, goals progress %, habit completion today)
- /api/chat: GET/POST /api/chat/conversations, GET /api/chat/conversations/{id}/messages, POST /api/chat/conversations/{id}/messages {content, source} -> AI reply {message, actions_executed}; POST /api/chat/conversations/{id}/analyze-meal {photo_base64} (Gemini vision when configured, honest error otherwise); DELETE conversation
- /api/goals + nested /api/goals/{id}/milestones (GET,POST,PATCH,DELETE) + POST /api/goals/{id}/progress {delta}
- /api/fitness: /api/fitness/exercises (GET seeded library + POST), /api/fitness/workouts (GET list, POST create w/ exercises, PATCH complete log sets), /api/fitness/workouts/generate {goal,experience,equipment,minutes,days_per_week} — Gemini when configured; otherwise returns 501 with honest message; /api/fitness/records; /api/fitness/stats (volume by week, PRs, consistency)
- /api/nutrition: /api/nutrition/meals CRUD (nested items), GET /api/nutrition/daily?date= (totals), GET /api/nutrition/weekly, POST /api/nutrition/hydrate {ml}, GET /api/nutrition/patterns (rule-based analysis of last 14 days: fiber low, protein low, vitamin C sources absent etc., with the exact cautious language required)
- /api/sleep: GET/POST /api/sleep/entries, GET /api/sleep/trends (7/30 day averages)
- /api/habits: CRUD, POST /api/habits/{id}/complete {date}, DELETE completion, GET /api/habits/progress (streaks, weekly %)
- /api/school: classes CRUD, assignments CRUD, study sessions CRUD, GET /api/school/summary
- /api/notes: CRUD + ?q= search + ?favorite= + favorite toggle
- /api/finance: entries CRUD, savings-goals CRUD, POST savings-goals/{id}/contribute {amount}, GET /api/finance/summary (totals by kind/category, biggest spending categories)
- /api/wellbeing: mood entries CRUD, GET /api/wellbeing/trends
- /api/reminders: CRUD, POST /{id}/complete; on create, notification_status = "sent" if provider configured else "not_connected"
- /api/notifications: GET status, POST /api/notifications/register-token {token,platform} (stores DeviceToken; docstring explains Expo/FCM wiring)
- /api/xp: GET (level, points, next_level_at, achievements, recent events); services/xp.py award_xp(db,user,points,reason) with level curve level n requires 100*n*(n+1)/2 points cumulative
- /api/weekly-review: GET latest, POST generate (computes REAL stats from DB: workouts completed, study minutes, habit %, sleep avg, nutrition logging days, goal progress, savings delta; then Gemini summary if configured, else template text with the real numbers, labeled as such)
- /api/recommendations: GET pending, POST /{id}/accept|dismiss (accept executes payload action)

## AI layer (backend/app/ai/)
- gemini.py: httpx call to https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent, server-side key only. Returns None if not configured. JSON mode instruction in prompt; robust JSON extraction (strip code fences). Timeout 30s; on error return None.
- prompts.py: SYSTEM_PROMPT (coach persona "Defiy", safety guardrails, evidence language rules, personalization use of context) + build_context(db,user): compact summary of profile, active goals, recent workouts/meals/sleep/habits/assignments/reminders/savings. + ACTIONS_DESCRIPTION: JSON list the model may return: [{"action":"create_reminder","args":{...}}, ...] full registry: create_reminder, update_reminder, create_goal, update_goal_progress, log_meal, log_workout, create_assignment, create_note, create_habit, log_sleep, log_finance, create_savings_goal, contribute_savings, show_progress, generate_workout, generate_study_plan, set_water.
- actions.py: execute_action(db,user,action,args)->{ok,result,summary,human_message}; validates args (raises ValueError with friendly message), writes DB, awards XP, returns confirmation like "Done — I created a reminder for Chemistry at 7:00 PM."
- chat.py: build messages, call Gemini, expect {"reply": str, "actions": [...]}; execute actions; save Message rows (user + assistant with actions JSON); if Gemini unavailable: fallback_parser.py handles explicit commands via regex — "remind me to X at 7pm/tomorrow at 8am/in 10 minutes", "log my meal/breakfast: ...", "I ate ...", "create a goal to save $500", "add my test on friday", "log my sleep", "water", "show my progress" (returns real data summary); otherwise replies with the honest not-connected message.
- Meal photo flow: gemini vision prompt asks ONLY for identified foods + portion estimates as JSON; backend looks up values from data/foods.py (fuzzy name match) computing macros per portion; anything unmatched is flagged for user entry. Response clearly marks estimates.

## Services
- services/quotes.py, services/xp.py, services/notifications.py, services/nutrient_patterns.py, services/weekly_review.py as described above.

## main.py
create_app: FastAPI(title="Defiy OS API"), CORS from settings, include all routers with /api prefix, startup: Base.metadata.create_all, seed exercise library (~40 exercises) + achievement catalog once (idempotent, global tables).

## seed.py
python -m app.seed: creates demo@defiy.os / demo1234 with rich demo data (2 weeks of workouts/meals/sleep/habits/goals/school/finance/mood/reminders) so UI has realistic sample data. Clearly labeled demo account. Idempotent.

## Tests (backend/tests/)
test_auth.py, test_chat_fallback.py (command parser creates reminder/meal/goal without Gemini), test_crud.py (goals/habits/finance isolation: user A cannot see user B's data), test_dashboard.py, test_xp.py. Use in-memory SQLite (DATABASE_URL=sqlite://) with dependency override. ALL tests must pass — run them: cd backend && pip install -r requirements.txt && pytest -q

## Deliverable
Complete, runnable backend. Verify before finishing: pytest passes AND uvicorn boots (import app.main). Keep code clean, typed, commented where non-obvious.
