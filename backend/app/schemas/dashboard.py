from typing import List, Optional
from pydantic import BaseModel
from app.schemas.quotes import QuoteOut

class FocusItem(BaseModel):
    id: str
    type: str  # "reminder" | "workout" | "assignment" | "habit" | "savings" | "goal"
    title: str
    subtitle: Optional[str] = None
    time: Optional[str] = None
    priority: str = "medium"  # "high" | "medium" | "low"

class DashboardStatCards(BaseModel):
    today_workout: Optional[str] = None
    upcoming_reminders_count: int = 0
    school_tasks_due: int = 0
    calories_consumed: float = 0.0
    calories_target: float = 2000.0
    last_sleep_hours: float = 0.0
    last_sleep_quality: int = 0
    goals_progress_pct: float = 0.0
    habit_completion_today: float = 0.0

class DashboardOut(BaseModel):
    greeting_name: str
    quote: QuoteOut
    focus_list: List[FocusItem]
    stats: DashboardStatCards
