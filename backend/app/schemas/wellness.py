"""Schemas for sleep, mood, habits, wellbeing."""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class SleepEntryCreate(BaseModel):
    date: date
    bedtime: Optional[datetime] = None
    wake_time: Optional[datetime] = None
    total_minutes: Optional[int] = None
    quality: Optional[int] = None      # 1-5
    energy: Optional[int] = None       # 1-5
    soreness: Optional[int] = None     # 1-5
    fatigue: Optional[int] = None      # 1-5
    notes: Optional[str] = None


class SleepEntryOut(SleepEntryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int


class MoodEntryCreate(BaseModel):
    date: date
    mood: int                          # 1-5
    stress: Optional[int] = None        # 1-5
    journal: Optional[str] = None
    tags: Optional[List[str]] = None


class MoodEntryOut(MoodEntryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int


class HabitCreate(BaseModel):
    name: str
    icon: Optional[str] = "flame"
    color: Optional[str] = "#6366f1"
    frequency: str = "daily"            # daily | weekly
    target_per_week: Optional[int] = 7
    active: bool = True


class HabitOut(HabitCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_date: datetime
    updated_date: datetime


class HabitCompletionCreate(BaseModel):
    date: date
    note: Optional[str] = None


class HabitCompletionOut(HabitCompletionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    habit_id: int
