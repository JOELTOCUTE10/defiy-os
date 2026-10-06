"""Goals SQLAlchemy models: Goal, GoalMilestone."""
from sqlalchemy import Column, Boolean, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base
from sqlalchemy.orm import relationship
from .mixins import created_col, updated_col


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="general")
    target_value = Column(Float, nullable=True)
    current_value = Column(Float, default=0.0)
    unit = Column(String(30), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="active")  # "active" | "completed" | "paused"
    notes = Column(Text, nullable=True)
    milestones = relationship("GoalMilestone", cascade="all, delete-orphan",
                              order_by="GoalMilestone.target_value")
    created_date = created_col()
    updated_date = updated_col()


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    target_value = Column(Float, nullable=False)
    completed = Column(Boolean, default=False)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    created_date = created_col()
    updated_date = updated_col()
