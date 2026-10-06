"""Schemas for AI chat."""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class ChatMessageIn(BaseModel):
    content: str
    source: str = "text"                # text | voice


class ChatActionRecord(BaseModel):
    action: str
    summary: str
    result_id: Optional[int] = None
    status: str = "done"                # done | failed


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    actions: Optional[List[Any]] = None
    source: str
    created_date: datetime


class ConversationCreate(BaseModel):
    title: str = "New conversation"


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_date: datetime
    updated_date: datetime


class ChatReply(BaseModel):
    message: ChatMessageOut
    actions_executed: List[ChatActionRecord] = []
    no_engine: bool = False              # honest flag: Gemini not configured


class MealAnalysisItem(BaseModel):
    name: str
    quantity: float
    unit: str
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    is_estimate: bool = True


class MealAnalysis(BaseModel):
    items: List[MealAnalysisItem]
    notes: str = ""


class WorkoutPlanOut(BaseModel):
    title: str
    exercises: List[dict]
    notes: str = ""
