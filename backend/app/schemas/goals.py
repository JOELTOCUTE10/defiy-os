from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class MilestoneCreate(BaseModel):
    name: str
    target_value: float

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    target_value: Optional[float] = None
    completed: Optional[bool] = None

class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    name: str
    target_value: float
    completed: bool
    completed_date: Optional[datetime] = None

class GoalCreate(BaseModel):
    name: str
    category: Optional[str] = "general"
    target_value: Optional[float] = None
    current_value: Optional[float] = 0.0
    unit: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = "active"
    notes: Optional[str] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    category: str
    target_value: Optional[float] = None
    current_value: float
    unit: Optional[str] = None
    deadline: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_date: datetime
    updated_date: datetime
    milestones: List[MilestoneOut] = []

class GoalProgressIn(BaseModel):
    delta: float
