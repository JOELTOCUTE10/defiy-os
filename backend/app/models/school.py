"""School SQLAlchemy models: SchoolClass, Assignment, StudySession."""
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class SchoolClass(Base):
    __tablename__ = "school_classes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(120), nullable=False)
    teacher = Column(String(120), nullable=True)
    schedule = Column(String(200), nullable=True)
    color = Column(String(20), default="#3B82F6")
    created_date = created_col()
    updated_date = updated_col()


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    type = Column(String(20), default="homework")  # "homework" | "project" | "test" | "quiz"
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending")  # "pending" | "completed"
    notes = Column(Text, nullable=True)
    created_date = created_col()
    updated_date = updated_col()


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True)
    topic = Column(String(150), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    minutes = Column(Integer, default=30)
    notes = Column(Text, nullable=True)
    completed = Column(Boolean, default=True)
    created_date = created_col()
    updated_date = updated_col()
