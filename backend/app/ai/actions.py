"""AI action registry: validated, real writes to the database.

Each action returns a dict {ok, summary, result_id} where summary is a
friendly confirmation shown in chat, e.g. "Done — I created a reminder for
Chemistry at 7:00 PM."
"""
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.core import User, Conversation, Message
from app.models.goals import Goal, GoalMilestone
from app.models.nutrition import Meal, MealItem, HydrationEntry
from app.models.fitness import Workout
from app.models.school import Assignment, StudySession
from app.models.notes import Note
from app.models.wellness import Habit, SleepEntry, MoodEntry
from app.models.finance import FinanceEntry, SavingsGoal
from app.models.reminders import Reminder
from app.services.xp import award_xp
from .nutrition_lookup import lookup_food


def _dt(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise ValueError("I need a date and time for that.")


def _d(value) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value[:10])
    return date.today()


def create_reminder(db, user, title, remind_at=None, repeat="none", category="other", **_):
    r = Reminder(user_id=user.id, title=title,
                 remind_at=_dt(remind_at) if remind_at else datetime.now() + timedelta(hours=1),
                 repeat=repeat or "none", category=category, notification_status="not_connected")
    db.add(r)
    db.commit()
    return {"ok": True, "result_id": r.id,
            "summary": f"Done — I created a reminder for {title} at {_dt(remind_at):%I:%M %p on %A}." if remind_at else f"Done — I created a reminder for {title}."}


def create_goal(db, user, name, category="personal", target_value=None, unit=None, deadline=None, **_):
    g = Goal(user_id=user.id, name=name, category=category,
             target_value=float(target_value) if target_value is not None else None,
             current_value=0.0, unit=unit, deadline=_dt(deadline) if deadline else None)
    if g.target_value:
        step = g.target_value / 4.0
        for i in range(1, 4):
            db.add(GoalMilestone(user_id=user.id, goal_id=None, name=f"Reach {round(step*i, 1)}{' ' + unit if unit else ''}", target_value=step * i))
    db.add(g)
    db.commit()
    for m in db.query(GoalMilestone).filter(GoalMilestone.user_id == user.id, GoalMilestone.goal_id.is_(None)).all():
        m.goal_id = g.id
    db.commit()
    return {"ok": True, "result_id": g.id, "summary": f"Done — I created the goal \"{name}\"."}


def update_goal_progress(db, user, goal_id, delta, **_):
    g = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not g:
        return {"ok": False, "summary": "I couldn't find that goal."}
    g.current_value += float(delta)
    if g.target_value and g.current_value >= g.target_value and g.status != "completed":
        g.status = "completed"
        award_xp(db, user.id, "goal_completed", "goal", g.id)
    db.commit()
    pct = round(100 * g.current_value / g.target_value) if g.target_value else None
    return {"ok": True, "result_id": g.id, "summary": f"Updated {g.name}: {g.current_value}/{g.target_value or '?'}" + (f" ({pct}%)." if pct is not None else ".")}


def log_meal(db, user, title="Meal", meal_type="lunch", items=None, date=None, **_):
    from datetime import date as date_type  # avoid param shadowing
    items = items or []
    m = Meal(user_id=user.id, title=title, meal_type=meal_type,
             date=_d(date) if date else date_type.today(), source="ai", confirmed=True)
    db.add(m)
    db.commit()
    total_items = []
    for it in items:
        name = it.get("name", "food")
        qty = float(it.get("quantity", 1) or 1)
        unit = it.get("unit", "serving")
        found = lookup_food(name)
        macros = {}
        if found:
            scale = qty / (found.get("quantity", 1) or 1)
            macros = {k: round((found.get(k) or 0) * scale, 1)
                      for k in ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g")}
            total_items.append(MealItem(user_id=user.id, meal_id=m.id, name=name,
                                         quantity=qty, unit=unit, is_estimate=True, **macros))
        else:
            total_items.append(MealItem(user_id=user.id, meal_id=m.id, name=name,
                                        quantity=qty, unit=unit, is_estimate=True))
    for ti in total_items:
        db.add(ti)
    db.commit()
    award_xp(db, user.id, "meal_logged", "meal", m.id)
    return {"ok": True, "result_id": m.id, "summary": f"Done — I logged {title} ({len(items)} item{'s' if len(items) != 1 else ''})."}


def log_workout(db, user, title="Workout", exercises=None, duration_minutes=45, **_):
    w = Workout(user_id=user.id, title=title, date=datetime.now(), status="completed",
                duration_minutes=int(duration_minutes or 45), source="ai")
    db.add(w)
    db.commit()
    award_xp(db, user.id, "workout_completed", "workout", w.id)
    return {"ok": True, "result_id": w.id, "summary": f"Done — I logged your workout: {title}."}


def create_assignment(db, user, title, type="homework", due_date=None, **_):
    a = Assignment(user_id=user.id, title=title, type=type, due_date=_dt(due_date) if due_date else None)
    db.add(a)
    db.commit()
    return {"ok": True, "result_id": a.id, "summary": f"Done — I added your {type} \"{title}\"."}


def create_study_plan(db, user, assignment_title, due_date=None, minutes_per_day=30, **_):
    """Distribute study sessions across days until the due date (max 7)."""
    end = _dt(due_date).date() if due_date else date.today() + timedelta(days=5)
    days_left = (end - date.today()).days
    if days_left <= 0:
        days_left = 1
    n = min(days_left, 7)
    created = []
    for i in range(n):
        s = StudySession(user_id=user.id, topic=f"{assignment_title} — session {i+1}",
                         date=date.today() + timedelta(days=i), minutes=int(minutes_per_day or 30))
        db.add(s)
        created.append(s)
    db.commit()
    a = Assignment(user_id=user.id, title=assignment_title, type="test",
                   due_date=_dt(due_date) if due_date else None)
    db.add(a)
    db.commit()
    return {"ok": True, "result_id": a.id,
            "summary": f"Done — I scheduled {n} study session{'s' if n != 1 else ''} for {assignment_title} ({minutes_per_day} min/day)."}


def create_note(db, user, title, content="", category="personal", **_):
    n = Note(user_id=user.id, title=title, content=content or "", category=category)
    db.add(n)
    db.commit()
    award_xp(db, user.id, "note_created", "note", n.id)
    return {"ok": True, "result_id": n.id, "summary": f"Done — I saved the note \"{title}\"."}


def create_habit(db, user, name, frequency="daily", target_per_week=None, **_):
    h = Habit(user_id=user.id, name=name, frequency=frequency or "daily",
              target_per_week=int(target_per_week) if target_per_week else (7 if frequency != "weekly" else 3))
    db.add(h)
    db.commit()
    return {"ok": True, "result_id": h.id, "summary": f"Done — I added the habit \"{name}\"."}


def log_sleep(db, user, total_minutes=None, quality=None, energy=None, soreness=None, fatigue=None, notes=None, **_):
    s = SleepEntry(user_id=user.id, date=date.today(),
                   total_minutes=int(total_minutes or 420),
                   quality=quality, energy=energy, soreness=soreness, fatigue=fatigue, notes=notes)
    db.add(s)
    db.commit()
    award_xp(db, user.id, "sleep_logged", "sleep", s.id)
    hrs = round((total_minutes or 420) / 60, 1)
    return {"ok": True, "result_id": s.id, "summary": f"Done — I logged {hrs} hours of sleep."}


def log_finance(db, user, kind="expense", amount=0, category="other", description=None, **_):
    f = FinanceEntry(user_id=user.id, kind=kind, amount=float(amount or 0),
                     category=category or "other", description=description, date=date.today())
    db.add(f)
    db.commit()
    if kind == "savings":
        award_xp(db, user.id, "savings_contribution", "finance", f.id)
    return {"ok": True, "result_id": f.id, "summary": f"Done — I logged a {kind} of ${amount:,.2f}."}


def create_savings_goal(db, user, name, target_amount=None, deadline=None, **_):
    sg = SavingsGoal(user_id=user.id, name=name,
                     target_amount=float(target_amount or 0),
                     deadline=_d(deadline) if deadline else None)
    db.add(sg)
    db.commit()
    return {"ok": True, "result_id": sg.id, "summary": f"Done — I created the savings goal \"{name}\" for ${float(target_amount or 0):,.0f}."}


def contribute_savings(db, user, savings_goal_id=None, amount=0, **_):
    q = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id)
    sg = q.filter(SavingsGoal.id == savings_goal_id).first() if savings_goal_id else q.filter(SavingsGoal.status == "active").first()
    if not sg:
        return {"ok": False, "summary": "I couldn't find that savings goal."}
    sg.current_amount += float(amount or 0)
    if sg.target_amount and sg.current_amount >= sg.target_amount:
        sg.status = "completed"
    f = FinanceEntry(user_id=user.id, kind="savings", amount=float(amount or 0),
                     category="savings", description=f"Contribution to {sg.name}", date=date.today())
    db.add(f)
    db.commit()
    award_xp(db, user.id, "savings_contribution", "finance", sg.id)
    return {"ok": True, "result_id": sg.id, "summary": f"Done — {sg.name}: ${sg.current_amount:,.2f} of ${sg.target_amount:,.2f}."}


def log_mood(db, user, mood=3, stress=None, journal=None, **_):
    m = MoodEntry(user_id=user.id, date=date.today(), mood=int(mood or 3),
                  stress=stress, journal=journal)
    db.add(m)
    db.commit()
    award_xp(db, user.id, "mood_logged", "mood", m.id)
    return {"ok": True, "result_id": m.id, "summary": "Done — I logged how you're feeling today."}


def set_water(db, user, ml=250, **_):
    h = HydrationEntry(user_id=user.id, date=date.today(), ml=int(ml or 250))
    db.add(h)
    db.commit()
    return {"ok": True, "result_id": h.id, "summary": f"Done — I logged {ml} ml of water."}


def show_progress(db, user, **_):
    goals = db.query(Goal).filter(Goal.user_id == user.id, Goal.status == "active").all()
    workouts = db.query(Workout).filter(Workout.user_id == user.id, Workout.status == "completed").count()
    meals = db.query(Meal).filter(Meal.user_id == user.id).count()
    lines = [f"Here's your real progress so far:"]
    lines.append(f"- Workouts completed: {workouts}")
    lines.append(f"- Meals logged: {meals}")
    for g in goals:
        pct = round(100 * g.current_value / g.target_value) if g.target_value else None
        lines.append(f"- {g.name}: {g.current_value}/{g.target_value or '?'}" + (f" ({pct}%)" if pct is not None else ""))
    return {"ok": True, "summary": "\n".join(lines)}


ACTIONS = {
    "create_reminder": create_reminder,
    "create_goal": create_goal,
    "update_goal_progress": update_goal_progress,
    "log_meal": log_meal,
    "log_workout": log_workout,
    "create_assignment": create_assignment,
    "create_study_plan": create_study_plan,
    "create_note": create_note,
    "create_habit": create_habit,
    "log_sleep": log_sleep,
    "log_finance": log_finance,
    "create_savings_goal": create_savings_goal,
    "contribute_savings": contribute_savings,
    "log_mood": log_mood,
    "set_water": set_water,
    "show_progress": show_progress,
}


def execute_action(db: Session, user: User, action: str, args: dict) -> dict:
    fn = ACTIONS.get(action)
    if not fn:
        return {"ok": False, "summary": f"I don't have an action called \"{action}\"."}
    try:
        return fn(db, user, **(args or {}))
    except Exception as e:  # validation or DB error -> friendly, no crash
        return {"ok": False, "summary": f"I couldn't do that: {e}"}
