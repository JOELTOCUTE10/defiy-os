"""Schemas for reminders."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    remind_at: Optional[datetime] = None      # if omitted with relative text, parser sets it
    repeat: str = "none"                       # none | daily | weekly | monthly
    repeat_day: Optional[int] = None           # 0-6 (Mon-Sun) for weekly repeats
    notify_minutes_before: int = 10
    category: str = "other"


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    remind_at: Optional[datetime] = None
    repeat: Optional[str] = None
    repeat_day: Optional[int] = None
    notify_minutes_before: Optional[int] = None
    category: Optional[str] = None
    completed: Optional[bool] = None


class ReminderOut(ReminderCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    completed: bool
    notification_status: str             # pending | sent | not_connected
    created_date: datetime
    updated_date: datetime


class NotificationStatus(BaseModel):
    provider: str
    connected: bool
    message: str
