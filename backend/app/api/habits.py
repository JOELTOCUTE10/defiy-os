"""Habit tracker. Consistency over perfection — never guilt-based."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.wellness import Habit, HabitCompletion
from app.services.xp import award_xp

router = APIRouter(prefix="/habits", tags=["habits"])


def _habit(db: Session, user_id: int, h_id: int) -> Habit:
    h = db.query(Habit).filter(Habit.id == h_id, Habit.user_id == user_id).first()
    if not h:
        raise HTTPException(404, "Habit not found")
    return h


def _habit_out(db: Session, h: Habit) -> dict:
    today = date.today()
    completions = (db.query(HabitCompletion)
                   .filter(HabitCompletion.habit_id == h.id,
                           HabitCompletion.date >= today - timedelta(days=29)).all())
    dates = {c.date for c in completions}
    streak = 0
    d = today
    while d in dates:
        streak += 1
        d -= timedelta(days=1)
    week_start = today - timedelta(days=today.weekday())
    week_done = len([c for c in completions if c.date >= week_start])
    target = h.target_per_week or 7
    return {"id": h.id, "name": h.name, "icon": h.icon, "color": h.color,
            "frequency": h.frequency, "target_per_week": target,
            "active": h.active, "done_today": today in dates, "streak": streak,
            "week_done": week_done, "week_pct": round(100 * min(week_done / target, 1), 1),
            "last_30_days": len(dates),
            "created_date": h.created_date, "updated_date": h.updated_date}


@router.get("")
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habits = db.query(Habit).filter(Habit.user_id == user.id,
                                    Habit.active == True).all()  # noqa: E712
    return [_habit_out(db, h) for h in habits]


@router.post("", status_code=201)
def create_habit(data: dict, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    h = Habit(user_id=user.id, name=data.get("name", "Habit"),
              icon=data.get("icon", "flame"), color=data.get("color", "#6366f1"),
              frequency=data.get("frequency", "daily"),
              target_per_week=data.get("target_per_week",
                                       7 if data.get("frequency", "daily") == "daily" else 3))
    db.add(h)
    db.commit()
    db.refresh(h)
    return _habit_out(db, h)


@router.patch("/{h_id}")
def update_habit(h_id: int, data: dict, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    h = _habit(db, user.id, h_id)
    for k in ("name", "icon", "color", "frequency", "target_per_week", "active"):
        if k in data:
            setattr(h, k, data[k])
    db.commit()
    db.refresh(h)
    return _habit_out(db, h)


@router.delete("/{h_id}", status_code=204)
def delete_habit(h_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    h = _habit(db, user.id, h_id)
    h.active = False
    db.commit()


@router.post("/{h_id}/complete", status_code=201)
def complete_habit(h_id: int, data: dict, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """Mark complete for a date (default today). Idempotent per date."""
    h = _habit(db, user.id, h_id)
    d = data.get("date") or date.today()
    if isinstance(d, str):
        d = date.fromisoformat(d[:10])
    existing = (db.query(HabitCompletion)
                .filter(HabitCompletion.habit_id == h.id, HabitCompletion.date == d).first())
    if not existing:
        db.add(HabitCompletion(user_id=user.id, habit_id=h.id, date=d))
        award_xp(db, user.id, "habit_completed", "habit", h.id)
        db.commit()
    return {"done": True, "date": str(d)}


@router.delete("/{h_id}/complete/{d}", status_code=204)
def uncomplete_habit(h_id: int, d: str, user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    h = _habit(db, user.id, h_id)
    day = date.fromisoformat(d[:10])
    existing = (db.query(HabitCompletion)
                .filter(HabitCompletion.habit_id == h.id, HabitCompletion.date == day).first())
    if existing:
        db.delete(existing)
        db.commit()


@router.get("/progress")
def habits_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    habits = db.query(Habit).filter(Habit.user_id == user.id,
                                    Habit.active == True).all()  # noqa: E712
    if not habits:
        return {"completion_pct": 0.0, "done_today": 0, "total": 0}
    done = 0
    for h in habits:
        exists = (db.query(HabitCompletion)
                  .filter(HabitCompletion.habit_id == h.id,
                          HabitCompletion.date == today).first())
        if exists:
            done += 1
    return {"completion_pct": round(100 * done / len(habits), 1),
            "done_today": done, "total": len(habits)}
