"""Reminders SQLAlchemy model: Reminder."""
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    remind_at = Column(DateTime(timezone=True), nullable=False)
    repeat = Column(String(20), default="none")  # "none" | "daily" | "weekly" | "monthly"
    repeat_day = Column(Integer, nullable=True)   # 0-6 day of week
    notify_minutes_before = Column(Integer, default=10)
    category = Column(String(50), default="general")
    completed = Column(Boolean, default=False)
    notification_status = Column(String(20), default="not_connected")  # "pending" | "sent" | "not_connected"
    created_date = created_col()
    updated_date = updated_col()
