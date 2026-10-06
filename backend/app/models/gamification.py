"""Gamification SQLAlchemy models: XPEvent, Achievement, UserAchievement, WeeklyReview."""
from sqlalchemy import Column, JSON, DateTime, ForeignKey, Integer, String, Text

from app.database import Base
from .mixins import created_col, updated_col


class XPEvent(Base):
    __tablename__ = "xp_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    points = Column(Integer, nullable=False)
    reason = Column(String(200), nullable=False)
    source_type = Column(String(50), nullable=True)
    source_id = Column(Integer, nullable=True)
    created_date = created_col()
    updated_date = updated_col()


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), default="trophy")
    points_required = Column(Integer, nullable=True)
    created_date = created_col()
    updated_date = updated_col()


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), index=True, nullable=False)
    earned_date = Column(DateTime(timezone=True), nullable=False)
    created_date = created_col()
    updated_date = updated_col()


class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    week_start = Column(DateTime(timezone=True), nullable=False)
    data = Column(JSON, nullable=False)
    summary = Column(Text, nullable=False)
    created_date = created_col()
    updated_date = updated_col()
