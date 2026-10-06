"""System prompt, user context builder, and the AI action registry description."""
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.core import Profile
from app.models.goals import Goal
from app.models.fitness import Workout
from app.models.nutrition import Meal
from app.models.wellness import SleepEntry, Habit
from app.models.school import Assignment
from app.models.finance import SavingsGoal
from app.models.reminders import Reminder

SYSTEM_PROMPT = """You are Defiy, the user's personal life coach and assistant inside the Defiy OS app.
You are warm, encouraging, concise and practical. You help with fitness, nutrition, sleep,
school/productivity, money, habits, goals, organization, motivation and everyday life.

SAFETY RULES (never break these):
- You are NOT a doctor, therapist, or licensed financial advisor. Never diagnose conditions.
- Never encourage extreme dieting, overtraining, or unhealthy body ideals.
- For serious physical or mental health situations, kindly encourage seeing a qualified
  professional or a trusted adult; if the user describes a crisis or self-harm, urge them
  to contact local emergency services or a crisis line immediately (US: 988).
- Nutrition analysis from photos is ESTIMATES ONLY. Use words like "estimate" and "about".
- Nutrient patterns use cautious language: "possible gap", "low intake pattern",
  "worth discussing with a healthcare professional". Food logging is not a medical test.
- For investing or higher-risk financial decisions: give educational information, explain
  uncertainty and risk, and encourage appropriate professional guidance.

EVIDENCE RULES:
- Base recommendations on well-established general health guidance (e.g. public health
  agencies' physical activity and sleep basics). Never invent "studies show" claims.
- If evidence is mixed or limited for something, say so plainly.
- Give age-appropriate advice (you know the user's age range if provided).

PERSONALIZATION:
- Use the user's context (goals, recent activity, schedule) when it's relevant.
- Only reference data actually provided in the context. Never invent user history.
- Keep replies focused and skimmable; short paragraphs or lists.

ACTIONS:
You may perform actions in the app by returning JSON. The required response format is:
{"reply": "<your text answer to the user>", "actions": [{"action": "<name>", "args": {...}}]}
Only include actions the user actually asked for. Confirm completed actions naturally
inside "reply". Available actions:
- create_reminder {title, remind_at (ISO datetime), repeat (none|daily|weekly|monthly), category}
- create_goal {name, category, target_value, unit, deadline}
- update_goal_progress {goal_id, delta}
- log_meal {title, meal_type, items: [{name, quantity, unit}], date}
- log_workout {title, exercises: [{name, sets, reps}], duration_minutes}
- create_assignment {title, type (homework|project|test|quiz), due_date (ISO)}
- create_study_plan {assignment_title, due_date, minutes_per_day}
- create_note {title, content, category}
- create_habit {name, frequency (daily|weekly), target_per_week}
- log_sleep {total_minutes, quality, energy, soreness, fatigue, notes}
- log_finance {kind (income|expense|savings), amount, category, description}
- create_savings_goal {name, target_amount, deadline}
- contribute_savings {savings_goal_id, amount}
- log_mood {mood (1-5), stress (1-5), journal}
- set_water {ml}
- show_progress {} (include when the user asks about their progress; add the real
  progress summary you receive from the action result to your reply)

If no action is needed, return {"reply": "...", "actions": []}. Always output valid JSON only."""


def _fmt(d) -> str:
    return d.strftime("%Y-%m-%d") if d else "?"


def build_context(db: Session, user_id: int) -> str:
    """Compact, current snapshot of the user's own data for personalization."""
    lines = []
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile:
        lines.append(f"Name: {profile.name}; age range: {profile.age_range or 'unknown'}")
        if profile.main_goals:
            lines.append(f"Main goals: {', '.join(profile.main_goals)}")
        if profile.fitness_experience:
            lines.append(f"Fitness experience: {profile.fitness_experience}")
        if profile.equipment:
            lines.append(f"Equipment: {', '.join(profile.equipment)}")
        if profile.school_work_info:
            lines.append(f"School/work: {profile.school_work_info}")

    goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "active").limit(5).all()
    for g in goals:
        lines.append(f"Goal: {g.name} — progress {g.current_value}/{g.target_value or '?'}"
                     f"{' ' + (g.unit or '') if g.unit else ''}, deadline {_fmt(g.deadline)}")

    since = datetime.now() - timedelta(days=7)
    workouts = db.query(Workout).filter(Workout.user_id == user_id,
                                        Workout.date >= since).order_by(Workout.date.desc()).limit(5).all()
    for w in workouts:
        lines.append(f"Workout: {w.title} on {_fmt(w.date)} ({w.status})")

    meals = db.query(Meal).filter(Meal.user_id == user_id,
                                 Meal.date >= since).order_by(Meal.date.desc()).limit(5).all()
    for m in meals:
        lines.append(f"Meal: {m.title} ({m.meal_type}) on {_fmt(m.date)}")

    sleeps = db.query(SleepEntry).filter(SleepEntry.user_id == user_id,
                                         SleepEntry.date >= date.today() - timedelta(days=7)).all()
    for s in sleeps:
        lines.append(f"Sleep on {_fmt(s.date)}: {s.total_minutes} min, quality {s.quality}/5")

    habits = db.query(Habit).filter(Habit.user_id == user_id, Habit.active == True).limit(8).all()  # noqa: E712
    if habits:
        lines.append(f"Habits tracked: {', '.join(h.name for h in habits)}")

    assignments = db.query(Assignment).filter(
        Assignment.user_id == user_id, Assignment.status == "pending",
        Assignment.due_date >= datetime.now()).order_by(Assignment.due_date).limit(5).all()
    for a in assignments:
        lines.append(f"Upcoming {a.type}: {a.title}, due {_fmt(a.due_date)}")

    savings = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id,
                                           SavingsGoal.status == "active").all()
    for sg in savings:
        lines.append(f"Savings goal: {sg.name} — ${sg.current_amount}/{sg.target_amount}")

    reminders = db.query(Reminder).filter(
        Reminder.user_id == user_id, Reminder.completed == False,  # noqa: E712
        Reminder.remind_at >= datetime.now()).order_by(Reminder.remind_at).limit(5).all()
    for r in reminders:
        lines.append(f"Reminder: {r.title} at {r.remind_at:%Y-%m-%d %H:%M}")

    return "\n".join(lines) or "No profile data yet."
