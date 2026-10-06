"""Schemas for notes."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    category: Optional[str] = "personal"
    favorite: bool = False
    tags: Optional[List[str]] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    favorite: Optional[bool] = None
    tags: Optional[List[str]] = None


class NoteOut(NoteCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_date: datetime
    updated_date: datetime
