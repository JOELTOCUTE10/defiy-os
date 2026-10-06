"""Schemas for finance entries and savings goals."""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class FinanceEntryCreate(BaseModel):
    kind: str                           # income | expense | savings
    amount: float
    category: Optional[str] = "other"
    description: Optional[str] = None
    date: Optional[date] = None


class FinanceEntryOut(FinanceEntryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: date
    created_date: datetime
    updated_date: datetime


class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[date] = None
    notes: Optional[str] = None


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[date] = None
    status: Optional[str] = None         # active | completed
    notes: Optional[str] = None


class SavingsGoalOut(SavingsGoalCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: str
    created_date: datetime
    updated_date: datetime


class ContributeRequest(BaseModel):
    amount: float


class FinanceSummary(BaseModel):
    income: float
    expenses: float
    savings: float
    net: float
    spending_by_category: dict
    biggest_spending_categories: List[dict]
