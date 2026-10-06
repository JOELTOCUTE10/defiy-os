"""Schemas for school classes, assignments, study sessions."""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class SchoolClassCreate(BaseModel):
    name: str
    teacher: Optional[str] = None
    schedule: Optional[str] = None
    color: Optional[str] = "#6366f1"


class SchoolClassOut(SchoolClassCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int


class AssignmentCreate(BaseModel):
    title: str
    type: str = "homework"              # homework | project | test | quiz
    class_id: Optional[int] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    class_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None        # pending | completed
    notes: Optional[str] = None


class AssignmentOut(AssignmentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: str
    created_date: datetime
    updated_date: datetime


class StudySessionCreate(BaseModel):
    topic: str
    assignment_id: Optional[int] = None
    class_id: Optional[int] = None
    date: Optional[date] = None
    minutes: int = 30
    notes: Optional[str] = None
    completed: bool = False


class StudySessionOut(StudySessionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: date


class StudyPlanOut(BaseModel):
    sessions: List[StudySessionCreate]
    note: str
