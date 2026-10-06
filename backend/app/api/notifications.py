"""Notification status + device token registration.

Honest architecture: tokens are stored now so a real push provider (Expo/FCM/APNs)
can be wired later without schema changes. Until then `connected: false`.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User, DeviceToken
from app.models.reminders import Reminder
from app.services.notifications import get_backend
from app.config import settings

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/status")
def status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    backend = get_backend()
    pending = db.query(Reminder).filter(
        Reminder.user_id == user.id, Reminder.completed == False,  # noqa: E712
        Reminder.remind_at >= __import__("datetime").datetime.now()).count()
    return {
        "provider": settings.PUSH_PROVIDER or "none",
        "backend": backend.name,
        "connected": backend.name != "not_connected",
        "message": ("Push notifications are not connected yet. Reminders are saved and "
                    "shown in the app; connect a push provider (Expo/FCM/APNs) to get "
                    "device notifications." if backend.name == "not_connected" else
                    "Push notifications are active."),
        "pending_reminders": pending,
    }


@router.post("/register-token", status_code=201)
def register_token(data: dict, user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    token = (data or {}).get("token", "").strip()
    if not token:
        return {"ok": False, "message": "No token provided"}
    existing = db.query(DeviceToken).filter(DeviceToken.user_id == user.id,
                                            DeviceToken.token == token).first()
    if existing:
        existing.active = True
    else:
        db.add(DeviceToken(user_id=user.id, token=token,
                            platform=data.get("platform", "web")))
    db.commit()
    return {"ok": True, "message": ("Token stored. Push delivery starts once a provider "
                                    "is connected.")}
