"""Reminders. Stored + scheduled honestly: push delivery requires a provider,
which /api/notifications/status reports as not connected until one is wired."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.reminders import Reminder
from app.services.notifications import is_connected
from app.services.xp import award_xp

router = APIRouter(prefix="/reminders", tags=["reminders"])


def _reminder(db: Session, user_id: int, r_id: int) -> Reminder:
    r = db.query(Reminder).filter(Reminder.id == r_id, Reminder.user_id == user_id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    return r


@router.get("")
def list_reminders(status: str | None = None, limit: int = 100,
                   user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Reminder).filter(Reminder.user_id == user.id)
    if status == "upcoming":
        q = q.filter(Reminder.completed == False,  # noqa: E712
                     Reminder.remind_at >= datetime.now())
        return q.order_by(Reminder.remind_at).limit(min(limit, 200)).all()
    if status == "completed":
        q = q.filter(Reminder.completed == True)  # noqa: E712
    return q.order_by(Reminder.remind_at.desc()).limit(min(limit, 200)).all()


@router.post("", status_code=201)
def create_reminder(data: dict, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    remind_at = data.get("remind_at") or datetime.now()
    if isinstance(remind_at, str):
        remind_at = datetime.fromisoformat(remind_at.replace("Z", "+00:00"))
    r = Reminder(user_id=user.id, title=data.get("title", "Reminder"),
                 description=data.get("description"),
                 remind_at=remind_at,
                 repeat=data.get("repeat", "none"), repeat_day=data.get("repeat_day"),
                 notify_minutes_before=data.get("notify_minutes_before", 10),
                 category=data.get("category", "other"),
                 notification_status="sent" if is_connected() else "not_connected")
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{r_id}")
def update_reminder(r_id: int, data: dict, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    r = _reminder(db, user.id, r_id)
    was_completed = r.completed
    for k in ("title", "description", "remind_at", "repeat", "repeat_day",
              "notify_minutes_before", "category", "completed"):
        if k in data:
            setattr(r, k, data[k])
    if data.get("completed") and not was_completed:
        award_xp(db, user.id, "reminder_completed", "reminder", r.id)
    db.commit()
    db.refresh(r)
    return r


@router.post("/{r_id}/complete")
def complete_reminder(r_id: int, user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    r = _reminder(db, user.id, r_id)
    if not r.completed:
        r.completed = True
        award_xp(db, user.id, "reminder_completed", "reminder", r.id)
        db.commit()
    db.refresh(r)
    return r


@router.delete("/{r_id}", status_code=204)
def delete_reminder(r_id: int, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    db.delete(_reminder(db, user.id, r_id))
    db.commit()
