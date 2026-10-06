"""Sleep, mood, and habits."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.wellness import SleepEntry, MoodEntry, Habit, HabitCompletion
from app.services.xp import award_xp

router = APIRouter(prefix="/wellness", tags=["wellness"])


# ---------- Sleep ----------
@router.get("/sleep")
def list_sleep(limit: int = 60, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    entries = (db.query(SleepEntry).filter(SleepEntry.user_id == user.id)
               .order_by(SleepEntry.date.desc()).limit(min(limit, 200)).all())
    avg = None
    if entries:
        vals = [e.total_minutes for e in entries if e.total_minutes]
        avg = round(sum(vals) / len(vals)) if vals else None
    return {"entries": entries, "average_minutes": avg,
            "trend": [{"date": e.date, "minutes": e.total_minutes, "quality": e.quality}
                      for e in reversed(entries)]}


@router.post("/sleep", status_code=201)
def log_sleep(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = SleepEntry(user_id=user.id, date=data.get("date") or date.today(),
                       bedtime=data.get("bedtime"), wake_time=data.get("wake_time"),
                       total_minutes=data.get("total_minutes"), quality=data.get("quality"),
                       energy=data.get("energy"), soreness=data.get("soreness"),
                       fatigue=data.get("fatigue"), notes=data.get("notes"))
    db.add(entry)
    db.commit()
    db.refresh(entry)
    award_xp(db, user.id, "sleep_logged", "sleep", entry.id)
    return entry


@router.delete("/sleep/{entry_id}", status_code=204)
def delete_sleep(entry_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    e = db.query(SleepEntry).filter(SleepEntry.id == entry_id,
                                    SleepEntry.user_id == user.id).first()
    if not e:
        raise HTTPException(404, "Sleep entry not found")
    db.delete(e)
    db.commit()


# ---------- Mood ----------
@router.get("/moods")
def list_moods(limit: int = 30, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    return (db.query(MoodEntry).filter(MoodEntry.user_id == user.id)
            .order_by(MoodEntry.date.desc()).limit(min(limit, 200)).all())


@router.post("/moods", status_code=201)
def log_mood(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = MoodEntry(user_id=user.id, date=data.get("date") or date.today(),
                  mood=data.get("mood", 3), stress=data.get("stress"),
                  journal=data.get("journal"), tags=data.get("tags"))
    db.add(m)
    db.commit()
    db.refresh(m)
    award_xp(db, user.id, "mood_logged", "mood", m.id)
    return m


# ---------- Habits ----------
@router.get("/habits")
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    habits = db.query(Habit).filter(Habit.user_id == user.id,
                                    Habit.active == True).all()  # noqa: E712
    out = []
    for h in habits:
        completions = (db.query(HabitCompletion)
                       .filter(HabitCompletion.habit_id == h.id,
                               HabitCompletion.date >= today - timedelta(days=30)).all())
        dates = [c.date for c in completions]
        streak = 0
        d = today
        while d in dates:
            streak += 1
            d -= timedelta(days=1)
        week_done = len([c for c in completions if c.date >= week_start])
        target = h.target_per_week or 7
        out.append({
            "id": h.id, "name": h.name, "icon": h.icon, "color": h.color,
            "frequency": h.frequency, "target_per_week": target,
            "done_today": today in dates, "streak": streak,
            "week_done": week_done, "week_pct": round(100 * min(week_done / target, 1), 1),
            "last_30_days": len(dates),
        })
    return out


@router.post("/habits", status_code=201)
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
    return h


@router.delete("/habits/{habit_id}", status_code=204)
def delete_habit(habit_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    h = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user.id).first()
    if not h:
        raise HTTPException(404, "Habit not found")
    h.active = False
    db.commit()


@router.post("/habits/{habit_id}/toggle")
def toggle_habit(habit_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    """Toggle today's completion. Missing one day is fine — no guilt, just data."""
    h = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user.id).first()
    if not h:
        raise HTTPException(404, "Habit not found")
    today = date.today()
    existing = (db.query(HabitCompletion)
                .filter(HabitCompletion.habit_id == h.id, HabitCompletion.date == today).first())
    if existing:
        db.delete(existing)
        db.commit()
        return {"done_today": False}
    db.add(HabitCompletion(user_id=user.id, habit_id=h.id, date=today))
    award_xp(db, user.id, "habit_completed", "habit", h.id)
    db.commit()
    return {"done_today": True}
