"""Schemas for XP, achievements, weekly reviews, recommendations, device tokens."""
from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class XPEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    points: int
    reason: str
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    created_date: datetime


class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str
    icon: str
    points_required: Optional[int] = None
    earned: Optional[bool] = None
    earned_date: Optional[datetime] = None


class XPInfo(BaseModel):
    level: int
    level_points: int                    # points within current level
    next_level_points: int               # points needed for next level
    total_points: int
    achievements: List[AchievementOut]
    recent_events: List[XPEventOut]


class WeeklyReviewData(BaseModel):
    workouts_completed: int = 0
    study_minutes: int = 0
    habits_completed: int = 0
    habit_completion_pct: float = 0.0
    sleep_avg_minutes: Optional[float] = None
    nutrition_logging_days: int = 0
    goal_progress: List[dict] = []
    savings_delta: float = 0.0
    meals_logged: int = 0


class WeeklyReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    week_start: datetime
    data: dict
    summary: str
    created_date: datetime


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    text: str
    payload: Optional[dict] = None
    status: str
    created_date: datetime


class DeviceTokenIn(BaseModel):
    token: str
    platform: str = "web"
