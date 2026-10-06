"""Weekly review: computes REAL stats from the user's data, then (optionally)
asks Gemini to summarize. Without Gemini, a template summary built from the
real numbers is returned and clearly labeled."""
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.core import User
from app.models.fitness import Workout
from app.models.nutrition import Meal
from app.models.wellness import SleepEntry, HabitCompletion, Habit
from app.models.school import StudySession
from app.models.goals import Goal
from app.models.finance import FinanceEntry
from app.models.gamification import WeeklyReview


def compute_week_stats(db: Session, user_id: int) -> dict:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    since = datetime.combine(week_start, datetime.min.time())

    workouts = db.query(Workout).filter(
        Workout.user_id == user_id, Workout.date >= since,
        Workout.status == "completed").count()

    sessions = db.query(StudySession).filter(
        StudySession.user_id == user_id, StudySession.date >= week_start).all()
    study_minutes = sum(s.minutes for s in sessions if s.completed)

    habit_completions = db.query(HabitCompletion).filter(
        HabitCompletion.user_id == user_id, HabitCompletion.date >= week_start).count()
    active_habits = db.query(Habit).filter(
        Habit.user_id == user_id, Habit.active == True).count()  # noqa: E712
    possible = max(1, active_habits * 7)
    habit_pct = round(100.0 * habit_completions / possible, 1)

    sleeps = db.query(SleepEntry).filter(
        SleepEntry.user_id == user_id, SleepEntry.date >= week_start,
        SleepEntry.total_minutes).all()
    sleep_avg = round(sum(s.total_minutes for s in sleeps) / len(sleeps)) if sleeps else None

    meals = db.query(Meal).filter(Meal.user_id == user_id, Meal.date >= week_start).all()
    logging_days = len({m.date.date() if isinstance(m.date, datetime) else m.date for m in meals})

    goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "active").all()
    goal_progress = [{
        "name": g.name,
        "current": g.current_value,
        "target": g.target_value,
        "pct": round(100.0 * g.current_value / g.target_value, 1) if g.target_value else None,
    } for g in goals]

    savings = db.query(FinanceEntry).filter(
        FinanceEntry.user_id == user_id, FinanceEntry.kind == "savings",
        FinanceEntry.date >= week_start).all()
    savings_delta = sum(f.amount for f in savings)

    return {
        "week_start": week_start.isoformat(),
        "workouts_completed": workouts,
        "study_minutes": study_minutes,
        "habits_completed": habit_completions,
        "habit_completion_pct": habit_pct,
        "sleep_avg_minutes": sleep_avg,
        "nutrition_logging_days": logging_days,
        "meals_logged": len(meals),
        "goal_progress": goal_progress,
        "savings_delta": round(savings_delta, 2),
    }


def template_summary(stats: dict) -> str:
    hours = round((stats["sleep_avg_minutes"] or 0) / 60, 1)
    top_goal = max(stats["goal_progress"], key=lambda g: g.get("pct") or 0, default=None)
    lines = [
        "Here's your week in real numbers (auto-computed, AI summary not connected):",
        f"- Workouts completed: {stats['workouts_completed']}",
        f"- Study time: {stats['study_minutes']} minutes",
        f"- Habits: {stats['habits_completed']} completions ({stats['habit_completion_pct']}% of the week's target)",
        f"- Average sleep: {hours} hours" if stats["sleep_avg_minutes"] else "- Sleep: no entries this week",
        f"- Meals logged on {stats['nutrition_logging_days']} days",
        f"- Savings added: ${stats['savings_delta']:,.2f}",
    ]
    if top_goal:
        lines.append(f"- Most progress: {top_goal['name']} ({top_goal['pct']}%)")
    if stats["workouts_completed"] >= 3:
        lines.append("Biggest accomplishment: your training consistency.")
    elif stats["study_minutes"] >= 60:
        lines.append("Biggest accomplishment: you protected your study time.")
    else:
        lines.append("Biggest accomplishment: showing up — small counts too.")
    return "\n".join(lines)


def generate_review(db: Session, user: User) -> WeeklyReview:
    stats = compute_week_stats(db, user.id)
    summary = template_summary(stats)
    review = WeeklyReview(
        user_id=user.id,
        week_start=datetime.combine(date.fromisoformat(stats["week_start"]), datetime.min.time()),
        data=stats,
        summary=summary,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
