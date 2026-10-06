"""Wellness SQLAlchemy models: SleepEntry, MoodEntry, Habit, HabitCompletion."""
from sqlalchemy import Column, JSON, Boolean, DateTime, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class SleepEntry(Base):
    __tablename__ = "sleep_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    bedtime = Column(DateTime(timezone=True), nullable=True)
    wake_time = Column(DateTime(timezone=True), nullable=True)
    total_minutes = Column(Integer, nullable=False)
    quality = Column(Integer, default=3)  # 1-5
    energy = Column(Integer, default=3)   # 1-5
    soreness = Column(Integer, default=1) # 1-5
    fatigue = Column(Integer, default=1)  # 1-5
    notes = Column(Text, nullable=True)
    created_date = created_col()
    updated_date = updated_col()


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    mood = Column(Integer, default=3)    # 1-5
    stress = Column(Integer, default=3)  # 1-5
    journal = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    created_date = created_col()
    updated_date = updated_col()


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(120), nullable=False)
    icon = Column(String(50), default="check")
    color = Column(String(20), default="#3B82F6")
    frequency = Column(String(20), default="daily")  # "daily" | "weekly"
    target_per_week = Column(Integer, default=7)
    active = Column(Boolean, default=True)
    created_date = created_col()
    updated_date = updated_col()


class HabitCompletion(Base):
    __tablename__ = "habit_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    note = Column(Text, nullable=True)
    created_date = created_col()
    updated_date = updated_col()
