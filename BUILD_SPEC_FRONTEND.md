# Defiy OS — Frontend Build Spec (authoritative)

Project: "Defiy OS" — AI personal life coach & assistant. Mobile-first, premium, modern.
Stack: Vite + React 18 + TypeScript + react-router-dom v6 + Tailwind CSS v3 + recharts + lucide-react. Node 20.
Directory: defiy-os/frontend/ (create everything from scratch).

## Design system (premium, clean, friendly, not childish)
- Colors (CSS vars + Tailwind extend): brand indigo #6366f1 with gradient accent #8b5cf6; dark mode first-class via `dark:` classes + ThemeContext (light/dark/system). Backgrounds: light #f8fafc, dark #0b1020. Cards: rounded-2xl, subtle border + soft shadow, generous padding, 1 strong visual hierarchy per screen.
- Typography: Inter (fontsource). Rounded progress bars (h-2), smooth transitions (transition-all duration-200), skeleton loaders, empty states with friendly copy, consistent stat tiles.
- NEVER hard-code fake user data in components. All data from API. Loading + empty + error states everywhere.
- 5-tab bottom nav (fixed, mobile; sidebar on md+): HOME / AI / TRACK / GOALS / PROFILE (icons from lucide-react: Home, Sparkles, Activity, Target, User).

## Core files (frontend/src/) — build these exactly
- src/main.tsx, src/App.tsx: BrowserRouter, AuthGate (localStorage token; if no token -> Login/Register screen; if profile.onboarded false -> Onboarding), routes below.
- src/api/client.ts: `apiFetch(path, opts)` wrapping fetch with VITE_API_URL default "http://localhost:8000/api", JSON headers, Authorization Bearer, 401 -> clear token + redirect to login, typed generic `api.get/post/patch/del`. Throw ApiError with server message.
- src/api/types.ts: TS interfaces for every entity: Profile, Goal, GoalMilestone, Workout, WorkoutExercise, WorkoutSet, Exercise, PersonalRecord, Meal, MealItem, HydrationEntry, SleepEntry, MoodEntry, Habit, HabitCompletion, Reminder, SchoolClass, Assignment, StudySession, Note, FinanceEntry, SavingsGoal, XPInfo, Achievement, WeeklyReview, Conversation, ChatMessage (with actions?: ChatAction[]), DashboardData, Quote, Conversation.
- src/api/endpoints.ts: one exported object per domain with fully typed functions covering ALL backend endpoints (see BUILD_SPEC_BACKEND.md §REST routers — read that file for the exact paths).
- src/context/AuthContext.tsx: {user, profile, login, register, logout, refreshProfile, token}.
- src/context/ThemeContext.tsx: light/dark/system, persists to localStorage.
- src/components/ui/: Card.tsx (rounded-2xl border bg-card), ProgressBar.tsx, StatTile.tsx, Button.tsx, Input.tsx, Textarea.tsx, Select.tsx, Modal.tsx, EmptyState.tsx, Skeleton.tsx, Chip.tsx, PageHeader.tsx, SectionNav.tsx (horizontal scroll pills for sub-sections), ConfirmDialog.tsx.
- src/components/layout/: BottomNav.tsx, AppShell.tsx (main content area, max-w-6xl, px-4 pb-24 md:pb-8), TopBar.tsx (page title + theme toggle + level badge showing XP level).
- src/hooks/: useSpeechRecognition.ts (Web Speech API; returns supported, listening, transcript, start, stop; typed for webkitSpeechRecognition), useSpeech.ts (speechSynthesis play/stop for AI voice responses — real device TTS, button disabled with tooltip when unsupported), useToast.tsx (toast provider).
- src/components/chat/: MessageBubble.tsx (markdown-lite: bold, lists, line breaks; action confirmation chips under AI messages), ChatInput.tsx (textarea auto-grow, mic button, send button, mic state = edit-transcript-before-send), VoiceButton.tsx, TypingDots.tsx, SuggestedPrompts.tsx.

## Routes
/onboarding, / (Home), /chat (AI — central experience), /track (hub) + /track/fitness, /track/nutrition, /track/sleep, /track/habits, /goals + /goals/:id, /school, /notes, /finance, /wellbeing, /profile (settings), /weekly-review.

## Screens (build ALL; each with real API calls, loading skeletons, empty states, and mobile-first layouts)
1. Onboarding: friendly multi-step (name, age range, main goals multi-select, fitness experience, equipment, typical schedule, school/work, sleep prefs, finance goals, notification prefs, units). Skippable optional steps. PATCH /api/profile. Ends at personalized Home.
2. Home: greeting (time-aware), Quote of the Day card (gradient accent), Today's Focus list (numbered), stat cards grid: Today's workout, Upcoming reminders, School tasks, Nutrition (calories today), Sleep (last night), Goals %, Habit progress, XP/level mini. All from GET /api/dashboard. Links into each section.
3. AI Chat: conversation list drawer, new conversation button, message history, suggested prompts on empty state, typing indicator, action confirmation chips, mic button (useSpeechRecognition: record -> editable transcript -> send, source="voice"), speaker button per AI message (useSpeech), honest display when AI engine not connected (banner: "AI engine not connected yet — add GEMINI_API_KEY" shown when reply.flags.no_engine, while explicit commands still work).
4. Track hub: cards linking to fitness/nutrition/sleep/habits with mini-stats.
5. Fitness: workout list + history, start/complete workout flow (log sets: weight/reps/RIR, rest timer), exercise library grid, AI generate workout form (goal/equipment/minutes — shows honest error when 501), stats charts (recharts: weekly volume bars, PRs list, consistency line).
6. Nutrition: today's meals list w/ add-meal modal (items with name/quantity/unit; nutrition auto-lookup from backend), meal photo flow (upload -> POST analyze-meal -> shows identified foods + ESTIMATED portions, user confirms/corrects -> save), daily totals rings (calories/protein/carbs/fat/fiber), hydration tracker (+water button), weekly history, patterns card (from /api/nutrition/patterns, with "estimate, not a medical test" framing).
7. Sleep: log last night form (bedtime, wake, quality/energy/soreness/fatigue 1-5), trends chart (7/30d), recovery suggestions box (rule-based text from trends API).
8. Habits: habit cards w/ daily check-off, streak flames, weekly % rings, "consistency over perfection" copy, add habit modal.
9. Goals: goal cards with visual progress (name, category chip, $175/$500 style progress, milestone checklist, deadline), create/edit modal, goal detail page w/ milestones + progress update (+delta), AI break-into-actions hint via chat.
10. School: classes, assignments (due date chips, status), study sessions, AI study plan via chat action; summary card.
11. Notes: searchable list, favorites, categories, create/edit modal.
12. Finance: summary tiles (income/expenses/savings), entries list w/ add modal, savings goals with contribute flow, biggest spending categories (recharts donut).
13. Wellbeing: mood/stress check-in (emoji scale), journal entries list, trends chart, calm supportive copy; crisis-resources note visible when stress=5.
14. Profile/Settings: profile edit, units, theme, notification prefs + TRUE push status (GET /api/notifications/status — if not_connected show honest explainer), voice settings, AI prefs, privacy/data (export JSON via API, delete account), XP + achievements list, weekly review link.
15. Weekly Review page: real stats from POST /api/weekly-review (workouts, study minutes, habit %, sleep avg, nutrition days, goal progress, savings), biggest accomplishment, areas to improve, next week focus.

## Rules
- No any-types unless unavoidable; strict TS config. All pages use shared ui components. No inline styles.
- Honest states: if backend returns 501/flags.no_engine, show clear messaging, never fake.
- Keep files small & organized; comment non-obvious logic.
