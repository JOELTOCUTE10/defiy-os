"""Home dashboard: one endpoint powering the whole command center."""
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User, Profile
from app.models.fitness import Workout
from app.models.nutrition import Meal, MealItem
from app.models.wellness import SleepEntry, Habit, HabitCompletion
from app.models.goals import Goal
from app.models.school import Assignment
from app.models.finance import SavingsGoal
from app.models.reminders import Reminder
from app.schemas.dashboard import DashboardOut, FocusItem, DashboardStatCards
from app.schemas.quotes import QuoteOut
from app.services.quotes import pick_quote

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    name = profile.name if profile and profile.name else "friend"
    now = datetime.now()
    today = date.today()

    # Quote, personalized by main goal category
    category = None
    if profile and profile.main_goals:
        mapping = {"fitness": "fitness", "health": "recovery", "school": "school",
                   "money": "money", "personal": "growth", "productivity": "discipline",
                   "learning": "growth"}
        category = mapping.get((profile.main_goals or ["growth"])[0].lower())
    q = pick_quote(today, category)

    focus: list[FocusItem] = []

    reminders = (db.query(Reminder)
                 .filter(Reminder.user_id == user.id, Reminder.completed == False,  # noqa: E712
                         Reminder.remind_at >= now - timedelta(hours=2),
                         Reminder.remind_at <= now + timedelta(days=1))
                 .order_by(Reminder.remind_at).limit(5).all())
    for r in reminders:
        focus.append(FocusItem(id=f"reminder-{r.id}", type="reminder", title=r.title,
                               time=r.remind_at.strftime("%I:%M %p") if r.remind_at else None,
                               priority="high"))

    workout = (db.query(Workout)
               .filter(Workout.user_id == user.id, Workout.status == "planned",
                       Workout.date >= now.replace(hour=0, minute=0, second=0))
               .order_by(Workout.date).first())
    if workout:
        focus.append(FocusItem(id=f"workout-{workout.id}", type="workout",
                               title=workout.title, subtitle="Today's workout"))
    last_completed = (db.query(Workout)
                      .filter(Workout.user_id == user.id, Workout.status == "completed")
                      .order_by(Workout.date.desc()).first())
    if not workout and last_completed and last_completed.date.date() != today:
        focus.append(FocusItem(id="workout-none", type="workout", title="Get a workout in",
                               subtitle="No workout logged today yet"))

    assignments = (db.query(Assignment)
                   .filter(Assignment.user_id == user.id, Assignment.status == "pending",
                           Assignment.due_date <= now + timedelta(days=7))
                   .order_by(Assignment.due_date).limit(3).all())
    for a in assignments:
        due = a.due_date.strftime("%a %I:%M %p") if a.due_date else None
        focus.append(FocusItem(id=f"assignment-{a.id}", type="assignment", title=a.title,
                               subtitle=f"{a.type.title()} due", time=due, priority="high" if a.due_date and a.due_date.date() == today else "medium"))

    savings = (db.query(SavingsGoal)
               .filter(SavingsGoal.user_id == user.id, SavingsGoal.status == "active").all())
    for sg in savings[:2]:
        focus.append(FocusItem(id=f"savings-{sg.id}", type="savings",
                               title=f"Add to {sg.name}",
                               subtitle=f"${sg.current_amount:,.0f} of ${sg.target_amount:,.0f}"))

    goal = (db.query(Goal).filter(Goal.user_id == user.id, Goal.status == "active",
                                  Goal.deadline.isnot(None))
            .order_by(Goal.deadline).first())
    if goal:
        focus.append(FocusItem(id=f"goals-{goal.id}", type="goal", title=f"Work toward: {goal.name}",
                               subtitle=f"Due {goal.deadline.strftime('%b %d')}"))

    if not focus:
        focus.append(FocusItem(id="start", type="other",
                               title="Set your first goal or reminder",
                               subtitle="Talk to me in the AI tab — I'll set things up"))

    # Stat cards
    today_meals = db.query(Meal).filter(Meal.user_id == user.id,
                                        Meal.date >= now.replace(hour=0, minute=0, second=0)).all()
    meal_ids = [m.id for m in today_meals]
    calories = 0.0
    if meal_ids:
        calories = sum(i.calories or 0 for i in
                       db.query(MealItem).filter(MealItem.meal_id.in_(meal_ids)).all())

    last_sleep = (db.query(SleepEntry).filter(SleepEntry.user_id == user.id)
                  .order_by(SleepEntry.date.desc()).first())
    active_goals = db.query(Goal).filter(Goal.user_id == user.id, Goal.status == "active").all()
    goals_pct = (round(100 * sum(g.current_value or 0 for g in active_goals if g.target_value)
                       / sum(g.target_value for g in active_goals if g.target_value), 1)
                 if any(g.target_value for g in active_goals) else 0.0)

    active_habits = db.query(Habit).filter(Habit.user_id == user.id,
                                           Habit.active == True).all()  # noqa: E712
    done_today = db.query(HabitCompletion).filter(
        HabitCompletion.user_id == user.id, HabitCompletion.date == today).all()
    habit_ids_done = {c.habit_id for c in done_today}
    habit_pct = round(100 * len(habit_ids_done) / len(active_habits), 1) if active_habits else 0.0

    stats = DashboardStatCards(
        today_workout=workout.title if workout else None,
        upcoming_reminders_count=len(reminders),
        school_tasks_due=len(assignments),
        calories_consumed=round(calories, 1),
        calories_target=2000.0,
        last_sleep_hours=round((last_sleep.total_minutes or 0) / 60, 1) if last_sleep else 0.0,
        last_sleep_quality=last_sleep.quality if last_sleep else 0,
        goals_progress_pct=goals_pct,
        habit_completion_today=habit_pct,
    )

    return DashboardOut(
        greeting_name=name,
        quote=QuoteOut(quote=q["text"], author="Defiy", category=q["category"],
                       date=today.isoformat()),
        focus_list=focus,
        stats=stats,
    )
