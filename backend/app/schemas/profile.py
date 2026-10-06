from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    age_range: Optional[str] = None
    main_goals: Optional[List[str]] = None
    fitness_experience: Optional[str] = None
    equipment: Optional[List[str]] = None
    typical_schedule: Optional[str] = None
    school_work_info: Optional[str] = None
    sleep_preferences: Optional[str] = None
    finance_goals: Optional[Any] = None
    notification_prefs: Optional[Any] = None
    units: Optional[str] = "metric"
    theme: Optional[str] = "system"
    xp_enabled: bool = True
    smart_reminders_enabled: bool = True
    onboarded: bool = False

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age_range: Optional[str] = None
    main_goals: Optional[List[str]] = None
    fitness_experience: Optional[str] = None
    equipment: Optional[List[str]] = None
    typical_schedule: Optional[str] = None
    school_work_info: Optional[str] = None
    sleep_preferences: Optional[str] = None
    finance_goals: Optional[Any] = None
    notification_prefs: Optional[Any] = None
    units: Optional[str] = None
    theme: Optional[str] = None
    xp_enabled: Optional[bool] = None
    smart_reminders_enabled: Optional[bool] = None
