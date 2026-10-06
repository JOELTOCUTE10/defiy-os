"""Finance SQLAlchemy models: FinanceEntry, SavingsGoal."""
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class FinanceEntry(Base):
    __tablename__ = "finance_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    kind = Column(String(20), nullable=False)  # "income" | "expense" | "savings"
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(200), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    created_date = created_col()
    updated_date = updated_col()


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="active")  # "active" | "completed"
    notes = Column(Text, nullable=True)
    created_date = created_col()
    updated_date = updated_col()
